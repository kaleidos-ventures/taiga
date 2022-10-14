# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
from functools import reduce
from operator import or_
from typing import Any

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
from taiga.base.utils.datetime import aware_utcnow
from taiga.projects.invitations.choices import ProjectInvitationStatus
from taiga.projects.invitations.models import ProjectInvitation
from taiga.projects.memberships.models import ProjectMembership
from taiga.tokens.models import OutstandingToken
from taiga.users.models import AuthData, User
from taiga.users.tokens import VerifyUserToken


@sync_to_async
def get_first_user(**kwargs: Any) -> User | None:
    return User.objects.filter(**kwargs).first()


@sync_to_async
def user_exists(**kwargs: Any) -> bool:
    return User.objects.filter(**kwargs).exists()


@sync_to_async
def get_user_by_username_or_email(username_or_email: str) -> User | None:
    # first search is case insensitive
    try:
        return User.objects.get(Q(username__iexact=username_or_email) | Q(email__iexact=username_or_email))
    except User.DoesNotExist:
        return None


@sync_to_async
def get_users_by_emails_as_dict(emails: list[str]) -> dict[str, User]:
    """
    This repository returns active users with these emails as a dict whose key
    is the email and value the User object.
    """
    if not emails:
        return {}

    query = reduce(or_, (Q(email__iexact=email) for email in emails))
    return {u.email: u for u in User.objects.filter(is_active=True).filter(query)}


@sync_to_async
def get_users_by_usernames_as_dict(usernames: list[str]) -> dict[str, User]:
    """
    This repository returns active users with these usernames as a dict whose key
    is the username and value the User object.
    """
    if not usernames:
        return {}

    query = reduce(or_, (Q(username=username) for username in usernames))
    return {u.username: u for u in User.objects.filter(is_active=True).filter(query)}


@sync_to_async
def get_user_from_auth_data(key: str, value: str) -> User | None:
    auth_data = AuthData.objects.select_related("user").filter(key=key, value=value).first()
    if auth_data:
        return auth_data.user
    return None


@sync_to_async
def check_password(user: User, password: str) -> bool:
    return user.check_password(password)


@sync_to_async
def change_password(user: User, password: str) -> None:
    user.set_password(password)
    user.save()


@sync_to_async
def update_last_login(user: User) -> None:
    django_update_last_login(User, user)


@sync_to_async
def create_user(email: str, username: str, full_name: str, password: str, lang: str | None = None) -> User:
    user = User.objects.create(
        email=email, username=username, full_name=full_name, is_active=False, accepted_terms=True
    )
    if lang:
        user.lang = lang
    user.set_password(password)
    user.save()
    return user


@sync_to_async
def verify_user(user: User) -> None:
    user.is_active = True
    user.date_verification = aware_utcnow()
    user.save()


@sync_to_async
def create_auth_data(user: User, key: str, value: str, extra: dict[str, str] = {}) -> AuthData:
    return AuthData.objects.create(user=user, key=key, value=value, extra=extra)


@sync_to_async
def update_user(user: User, new_values: Any) -> User:
    if "password" in new_values:
        user.set_password(new_values.pop("password"))

    for attr, value in new_values.items():
        setattr(user, attr, value)

    user.save()
    return user


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


def _get_users_by_text_qs(
    text_search: str = "", project_slug: str | None = None, exclude_inactive: bool = True
) -> QuerySet[User]:
    """
    Get all the users that match a full text search (against their full_name and username fields), returning a
    prioritized (not filtered) list by their closeness to a given project (if any).

    :param text_search: The text the users should match in either their full names or usernames to be considered
    :param project_slug: Users will be ordered by their proximity to this project excluding itself
    :param exclude_inactive: true (return just active users), false (returns all users)
    :return: a prioritized queryset of users
    """
    users_qs = User.objects.all()

    if exclude_inactive:
        users_qs &= users_qs.exclude(is_active=False)

    if text_search:
        users_matching_full_text_search = get_users_by_fullname_or_username_sync(text_search, users_qs)
        users_qs = users_matching_full_text_search

    if project_slug:
        # List all the users matching the full-text search criteria, ordering results by their proximity to a project :
        #     1st. project members of this project
        #     2nd. members of the project's workspace / members of the project's organization (if any)
        #     3rd. rest of users (the priority for this group is not too important)

        # 1st: Users that share the same project
        memberships = ProjectMembership.objects.filter(user__id=OuterRef("pk"), project__slug=project_slug)
        pending_invitations = ProjectInvitation.objects.filter(
            user__id=OuterRef("pk"), project__slug=project_slug, status=ProjectInvitationStatus.PENDING
        )
        project_users_qs = (
            users_qs.filter(projects__slug=project_slug)
            .annotate(user_is_member=Exists(memberships))
            .annotate(user_has_pending_invitation=Exists(pending_invitations))
        )
        sorted_project_users_qs = _sort_queryset_if_unsorted(project_users_qs, text_search)

        # 2nd: Users that are members of the project's workspace but are NOT project members
        workspace_users_qs = (
            users_qs.filter(workspaces__projects__slug=project_slug)
            .annotate(user_is_member=Value(False, output_field=BooleanField()))
            .annotate(user_has_pending_invitation=Exists(pending_invitations))
            .exclude(projects__slug=project_slug)
        )
        sorted_workspace_users_qs = _sort_queryset_if_unsorted(workspace_users_qs, text_search)

        # 3rd: Users that are neither a project member nor a member of its workspace
        other_users_qs = (
            users_qs.exclude(projects__slug=project_slug)
            .exclude(workspaces__projects__slug=project_slug)
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


@sync_to_async
def get_users_by_text(
    text_search: str = "",
    project_slug: str | None = None,
    exclude_inactive: bool = True,
    offset: int = 0,
    limit: int = 0,
) -> list[User]:
    qs = _get_users_by_text_qs(text_search=text_search, project_slug=project_slug, exclude_inactive=exclude_inactive)
    if limit:
        return list(qs[offset : offset + limit])

    return list(qs)


@sync_to_async
def get_total_users_by_text(
    text_search: str = "", project_slug: str | None = None, exclude_inactive: bool = True
) -> int:
    qs = _get_users_by_text_qs(text_search=text_search, project_slug=project_slug, exclude_inactive=exclude_inactive)
    return qs.count()


def get_users_by_fullname_or_username_sync(text_search: str, user_qs: QuerySet[User]) -> QuerySet[User]:
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

    parsed_text_search = _get_parsed_text_search(text_search)
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


get_users_by_fullname_or_username = sync_to_async(get_users_by_fullname_or_username_sync)


def _get_parsed_text_search(text_search: str) -> str:
    # Prepares the SearchQuery text by escaping it and fixing spaces for searches over several words

    return repr(text_search.strip()).replace(" ", " & ")


def _sort_queryset_if_unsorted(users_qs: QuerySet[User], text_search: str) -> QuerySet[User]:
    if not text_search:
        return users_qs.order_by("full_name", "username")

    # the queryset has already been sorted by the "Full Text Search" and its annotated 'rank' field
    return users_qs
