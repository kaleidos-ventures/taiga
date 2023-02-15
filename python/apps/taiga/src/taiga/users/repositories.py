# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
from functools import reduce
from operator import or_
from typing import Literal, TypedDict
from uuid import UUID

from asgiref.sync import sync_to_async
from taiga.base.db.models import (
    BooleanField,
    Exists,
    Lower,
    OuterRef,
    Q,
    QuerySet,
    SearchQuery,
    SearchRank,
    SearchVector,
    StrIndex,
    Unaccent,
    Value,
)
from taiga.base.db.users import django_update_last_login
from taiga.projects.invitations.choices import ProjectInvitationStatus
from taiga.projects.invitations.models import ProjectInvitation
from taiga.projects.memberships.models import ProjectMembership
from taiga.projects.projects.models import Project
from taiga.tokens.models import OutstandingToken
from taiga.users.models import AuthData, User
from taiga.users.tokens import VerifyUserToken

##########################################################
# USER - filters and querysets
##########################################################


DEFAULT_QUERYSET = User.objects.all()


class UserFilters(TypedDict, total=False):
    id: UUID
    email: str
    emails: list[str]
    usernames: list[str]
    username_or_email: str
    is_active: bool
    guest_in_ws_for_project: Project


def _apply_filters_to_queryset(
    qs: QuerySet[User],
    filters: UserFilters = {},
) -> QuerySet[User]:
    filter_data = dict(filters.copy())

    if "emails" in filter_data:
        emails = filter_data.pop("emails")
        qs = qs.filter(reduce(or_, (Q(email__iexact=email) for email in emails)))  # type: ignore[attr-defined]

    if "usernames" in filter_data:
        usernames = filter_data.pop("usernames")
        filter_tmp = reduce(or_, (Q(username__iexact=username) for username in usernames))  # type: ignore[attr-defined]
        qs = qs.filter(filter_tmp)

    if "username_or_email" in filter_data:
        username_or_email = filter_data.pop("username_or_email")
        qs = qs.filter(Q(username__iexact=username_or_email) | Q(email__iexact=username_or_email))

    if "guest_in_ws_for_project" in filter_data:
        project = filter_data.pop("guest_in_ws_for_project")
        pj_members = Q(projects=project)
        pj_invitees = Q(
            project_invitations__project=project, project_invitations__status=ProjectInvitationStatus.PENDING
        )
        qs = qs.filter(pj_members | pj_invitees)
        qs = qs.exclude(workspaces=project.workspace).distinct()  # type: ignore[attr-defined]

    return qs.filter(**filter_data)


##########################################################
# create user
##########################################################


@sync_to_async
def create_user(email: str, username: str, full_name: str, color: int, lang: str, password: str | None) -> User:
    user = User.objects.create(
        email=email,
        username=username,
        full_name=full_name,
        is_active=False,
        accepted_terms=True,
        lang=lang,
        color=color,
    )
    if password:
        user.set_password(password)

    user.save()
    return user


##########################################################
# get users
##########################################################


@sync_to_async
def get_users(
    filters: UserFilters = {},
    offset: int | None = None,
    limit: int | None = None,
) -> list[User]:
    qs = _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)

    if limit is not None and offset is not None:
        limit += offset

    return list(qs[offset:limit])


##########################################################
# get user
##########################################################


@sync_to_async
def get_user(
    filters: UserFilters = {},
) -> User | None:
    qs = _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    try:
        return qs.get()
    except User.DoesNotExist:
        return None


##########################################################
# update user
##########################################################


@sync_to_async
def update_user(user: User) -> None:
    user.save()


##########################################################
# misc
##########################################################


@sync_to_async
def user_exists(
    filters: UserFilters = {},
) -> bool:
    qs = _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    return qs.exists()


@sync_to_async
def check_password(user: User, password: str) -> bool:
    return user.password != "" and user.check_password(password)


@sync_to_async
def change_password(user: User, password: str) -> None:
    user.set_password(password)
    user.save()


@sync_to_async
def update_last_login(user: User) -> None:
    django_update_last_login(User, user)


@sync_to_async
def clean_expired_users() -> None:
    # delete all users that are not currently active (is_active=False)
    # and have never verified the account (date_verification=None)
    # and don't have an outstanding token associated (exclude)
    (
        User.objects.filter(is_active=False, date_verification=None)
        .exclude(id__in=OutstandingToken.objects.filter(token_type=VerifyUserToken.token_type).values_list("object_id"))
        .delete()
    )


##########################################################
# user/s search
##########################################################


@sync_to_async
def get_users_by_text(
    text_search: str = "",
    project_id: UUID | None = None,
    exclude_inactive: bool = True,
    offset: int = 0,
    limit: int = 0,
) -> list[User]:
    qs = _get_users_by_text_qs(text_search=text_search, project_id=project_id, exclude_inactive=exclude_inactive)
    if limit:
        return list(qs[offset : offset + limit])

    return list(qs)


@sync_to_async
def get_total_users_by_text(
    text_search: str = "", project_id: UUID | None = None, exclude_inactive: bool = True
) -> int:
    qs = _get_users_by_text_qs(text_search=text_search, project_id=project_id, exclude_inactive=exclude_inactive)
    return qs.count()


def _get_users_by_text_qs(
    text_search: str = "", project_id: UUID | None = None, exclude_inactive: bool = True
) -> QuerySet[User]:
    """
    Get all the users that match a full text search (against their full_name and username fields), returning a
    prioritized (not filtered) list by their closeness to a given project (if any).

    :param text_search: The text the users should match in either their full names or usernames to be considered
    :param project_id: Users will be ordered by their proximity to this project excluding itself
    :param exclude_inactive: true (return just active users), false (returns all users)
    :return: a prioritized queryset of users
    """
    users_qs = User.objects.all()

    if exclude_inactive:
        users_qs &= users_qs.exclude(is_active=False)

    if text_search:
        users_matching_full_text_search = _get_users_by_fullname_or_username(text_search, users_qs)
        users_qs = users_matching_full_text_search

    if project_id:
        # List all the users matching the full-text search criteria, ordering results by their proximity to a project :
        #     1st. project members of this project
        #     2nd. members of the project's workspace / members of the project's organization (if any)
        #     3rd. rest of users (the priority for this group is not too important)

        # 1st: Users that share the same project
        memberships = ProjectMembership.objects.filter(user__id=OuterRef("pk"), project__id=project_id)
        pending_invitations = ProjectInvitation.objects.filter(
            user__id=OuterRef("pk"), project__id=project_id, status=ProjectInvitationStatus.PENDING
        )
        project_users_qs = (
            users_qs.filter(projects__id=project_id)
            .annotate(user_is_member=Exists(memberships))
            .annotate(user_has_pending_invitation=Exists(pending_invitations))
        )
        sorted_project_users_qs = _sort_queryset_if_unsorted(project_users_qs, text_search)

        # 2nd: Users that are members of the project's workspace but are NOT project members
        workspace_users_qs = (
            users_qs.filter(workspaces__projects__id=project_id)
            .annotate(user_is_member=Value(False, output_field=BooleanField()))
            .annotate(user_has_pending_invitation=Exists(pending_invitations))
            .exclude(projects__id=project_id)
        )
        sorted_workspace_users_qs = _sort_queryset_if_unsorted(workspace_users_qs, text_search)

        # 3rd: Users that are neither a project member nor a member of its workspace
        other_users_qs = (
            users_qs.exclude(projects__id=project_id)
            .exclude(workspaces__projects__id=project_id)
            .annotate(user_is_member=Value(False, output_field=BooleanField()))
            .annotate(user_has_pending_invitation=Exists(pending_invitations))
        )
        sorted_other_users_qs = _sort_queryset_if_unsorted(other_users_qs, text_search)

        # NOTE: `Union all` are important to keep the individual ordering when combining the different search criteria.
        users_qs = sorted_project_users_qs.union(
            sorted_workspace_users_qs.union(sorted_other_users_qs, all=True), all=True
        )
        return users_qs

    return _sort_queryset_if_unsorted(users_qs, text_search)


def _sort_queryset_if_unsorted(users_qs: QuerySet[User], text_search: str) -> QuerySet[User]:
    if not text_search:
        return users_qs.order_by("full_name", "username")

    # the queryset has already been sorted by the "Full Text Search" and its annotated 'rank' field
    return users_qs


def _get_users_by_fullname_or_username(text_search: str, user_qs: QuerySet[User]) -> QuerySet[User]:
    """
    This method searches for users matching a text in their full names and usernames (being accent and case
    insensitive) and order the results according to:
        1st. Order by full text search rank according to the specified matrix weights (0.5 to both full_name/username)
        2nd. Order by literal matches in full names detected closer to the left, or close to start with that text
        3rd. Order by full name alphabetically
        4th. Order by username alphabetically
    :param text_search: The text to search for (in user full names and usernames)
    :param user_qs: The base user queryset to which apply the filters to
    :return: A filtered queryset that will return an ordered list of users matching the text when executed
    """
    # Prepares the SearchQuery text by escaping it and fixing spaces for searches over several words
    parsed_text_search = repr(text_search.strip()).replace(" ", " & ")
    search_query = SearchQuery(f"{parsed_text_search}:*", search_type="raw", config="simple_unaccent")
    search_vector = SearchVector("full_name", weight="A", config="simple_unaccent") + SearchVector(
        "username", weight="B", config="simple_unaccent"
    )
    # By default values: [0.1, 0.2, 0.4, 1.0]
    # [D-weight, C-weight, B-weight, A-weight]
    rank_weights = [0.0, 0.0, 0.5, 0.5]

    full_text_matching_users = (
        user_qs.annotate(rank=SearchRank(search_vector, search_query, weights=rank_weights))
        .annotate(first_match=StrIndex(Unaccent(Lower("full_name")), Unaccent(Lower(Value(text_search)))))
        .filter(rank__gte=0.2)
        .order_by("-rank", "first_match", "full_name", "username")
    )

    return full_text_matching_users


##########################################################
# AUTH DATA - filters and querysets
##########################################################


DEFAULT_AUTH_DATA_QUERYSET = AuthData.objects.all()


class AuthDataFilters(TypedDict, total=False):
    key: str
    value: str


def _apply_filters_to_auth_data_queryset(
    qs: QuerySet[AuthData],
    filters: AuthDataFilters = {},
) -> QuerySet[AuthData]:
    return qs.filter(**filters)


class AuthDataListFilters(TypedDict, total=False):
    user_id: UUID


def _apply_filters_to_auth_data_queryset_list(
    qs: QuerySet[AuthData],
    filters: AuthDataListFilters = {},
) -> QuerySet[AuthData]:
    return qs.filter(**filters)


AuthDataSelectRelated = list[Literal["user"]]


def _apply_select_related_to_auth_data_queryset(
    qs: QuerySet[AuthData],
    select_related: AuthDataSelectRelated,
) -> QuerySet[AuthData]:
    return qs.select_related(*select_related)


##########################################################
# create auth data
##########################################################


@sync_to_async
def create_auth_data(user: User, key: str, value: str, extra: dict[str, str] = {}) -> AuthData:
    return AuthData.objects.create(user=user, key=key, value=value, extra=extra)


##########################################################
# get auths data
##########################################################


@sync_to_async
def get_auths_data(
    filters: AuthDataListFilters = {},
    select_related: AuthDataSelectRelated = ["user"],
) -> list[AuthData]:
    qs = _apply_filters_to_auth_data_queryset_list(qs=DEFAULT_AUTH_DATA_QUERYSET, filters=filters)
    qs = _apply_select_related_to_auth_data_queryset(qs=qs, select_related=select_related)

    return list(qs)


##########################################################
# get auth data
##########################################################


@sync_to_async
def get_auth_data(
    filters: AuthDataFilters = {},
    select_related: AuthDataSelectRelated = ["user"],
) -> AuthData | None:
    qs = _apply_filters_to_auth_data_queryset(qs=DEFAULT_AUTH_DATA_QUERYSET, filters=filters)
    qs = _apply_select_related_to_auth_data_queryset(qs=qs, select_related=select_related)

    try:
        return qs.get()
    except AuthData.DoesNotExist:
        return None
