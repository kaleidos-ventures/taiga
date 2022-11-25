# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from itertools import chain
from typing import Callable, Iterable, TypedDict
from uuid import UUID

from asgiref.sync import sync_to_async
from taiga.base.db.models import (
    BooleanField,
    Case,
    CharField,
    Coalesce,
    Count,
    Exists,
    IntegerField,
    OuterRef,
    Prefetch,
    Q,
    QuerySet,
    Subquery,
    Value,
    When,
)
from taiga.projects.invitations.choices import ProjectInvitationStatus
from taiga.projects.projects.models import Project
from taiga.users.models import User
from taiga.workspaces.workspaces.models import Workspace

##########################################################
# filters and querysets
##########################################################


DEFAULT_QUERYSET = Workspace.objects.all()


class WorkspaceFilters(TypedDict, total=False):
    id: UUID


def _apply_filters_to_queryset(
    qs: QuerySet[Workspace],
    filters: WorkspaceFilters = {},
) -> QuerySet[Workspace]:
    filter_data = dict(filters.copy())
    qs = qs.filter(**filter_data)
    return qs


##########################################################
# create workspace
##########################################################


@sync_to_async
def create_workspace(name: str, color: int, owner: User) -> Workspace:
    return Workspace.objects.create(name=name, color=color, owner=owner)


##########################################################
#  get workspace
##########################################################


@sync_to_async
def get_workspace(
    filters: WorkspaceFilters = {},
) -> Workspace | None:
    qs = _apply_filters_to_queryset(filters=filters, qs=DEFAULT_QUERYSET)
    try:
        return qs.get()
    except Workspace.DoesNotExist:
        return None


@sync_to_async
def get_workspace_detail(
    user_id: UUID | None,
    user_workspace_role_name: str,
    user_projects_count: int,
    filters: WorkspaceFilters = {},
) -> Workspace | None:
    qs = _apply_filters_to_queryset(filters=filters, qs=DEFAULT_QUERYSET)
    qs = qs.annotate(user_role=Value(user_workspace_role_name, output_field=CharField()))
    qs = qs.annotate(total_projects=Value(user_projects_count, output_field=IntegerField()))
    qs = qs.annotate(has_projects=Exists(Project.objects.filter(workspace=OuterRef("pk"))))
    qs = qs.annotate(
        user_is_owner=Case(When(owner_id=user_id, then=Value(True)), default=Value(False), output_field=BooleanField())
    )

    try:
        return qs.get()
    except Workspace.DoesNotExist:
        return None


@sync_to_async
def get_workspace_summary(
    user_workspace_role_name: str,
    filters: WorkspaceFilters = {},
) -> Workspace | None:
    qs = _apply_filters_to_queryset(filters=filters, qs=DEFAULT_QUERYSET)
    qs = qs.annotate(user_role=Value(user_workspace_role_name, output_field=CharField()))
    try:
        return qs.get()
    except Workspace.DoesNotExist:
        return None


##########################################################
# misc
##########################################################


@sync_to_async
def get_user_workspaces_overview(user: User) -> list[Workspace]:
    # workspaces where the user is ws-admin with all its projects
    admin_ws_ids = (
        Workspace.objects.filter(
            memberships__user__id=user.id,  # user_is_ws_member
            memberships__role__is_admin=True,  # user_ws_role_is_admin
        )
        .order_by("-created_at")
        .values_list("id", flat=True)
    )
    admin_ws: Iterable[Workspace] = Workspace.objects.none()
    for ws_id in admin_ws_ids:
        projects_ids = list(
            Project.objects.filter(workspace_id=ws_id)  # pj_in_workspace
            .order_by("-created_at")
            .values_list("id", flat=True)
        )
        total_projects = len(projects_ids)
        projects_qs = Project.objects.filter(id__in=projects_ids[:6]).order_by("-created_at")
        has_projects = Workspace.objects.get(id=ws_id).projects.count() > 0
        user_is_owner = Workspace.objects.get(id=ws_id).owner.id == user.id
        invited_projects_qs = Project.objects.filter(
            Q(invitations__user_id=user.id)
            | (Q(invitations__user__isnull=True) & Q(invitations__email__iexact=user.email)),
            invitations__status=ProjectInvitationStatus.PENDING,
            workspace_id=ws_id,
        )
        qs = (
            Workspace.objects.filter(id=ws_id)
            .prefetch_related(
                Prefetch("projects", queryset=projects_qs, to_attr="latest_projects"),
                Prefetch("projects", queryset=invited_projects_qs, to_attr="invited_projects"),
            )
            .annotate(total_projects=Value(total_projects, output_field=IntegerField()))
            .annotate(has_projects=Value(has_projects, output_field=BooleanField()))
            .annotate(user_role=Value("admin", output_field=CharField()))
            .annotate(user_is_owner=Value(user_is_owner, output_field=BooleanField()))
        )
        admin_ws = chain(admin_ws, qs)

    # workspaces where the user is ws-member with all its visible projects
    member_ws_ids = (
        Workspace.objects.filter(
            memberships__user__id=user.id,  # user_is_ws_member
            memberships__role__is_admin=False,  # user_ws_role_is_member
        )
        .order_by("-created_at")
        .values_list("id", flat=True)
    )
    member_ws: Iterable[Workspace] = Workspace.objects.none()
    for ws_id in member_ws_ids:
        pj_in_workspace = Q(workspace_id=ws_id)
        ws_allowed = ~Q(memberships__user__id=user.id) & Q(workspace_member_permissions__len__gt=0)
        pj_allowed = Q(memberships__user__id=user.id)
        projects_ids = list(
            Project.objects.filter(pj_in_workspace, (ws_allowed | pj_allowed))
            .order_by("-created_at")
            .values_list("id", flat=True)
        )
        total_projects = len(projects_ids)
        projects_qs = Project.objects.filter(id__in=projects_ids[:6]).order_by("-created_at")
        has_projects = Workspace.objects.get(id=ws_id).projects.count() > 0
        invited_projects_qs = Project.objects.filter(
            Q(invitations__user_id=user.id)
            | (Q(invitations__user__isnull=True) & Q(invitations__email__iexact=user.email)),
            invitations__status=ProjectInvitationStatus.PENDING,
            workspace_id=ws_id,
        )
        qs = (
            Workspace.objects.filter(id=ws_id)
            .prefetch_related(
                Prefetch("projects", queryset=projects_qs, to_attr="latest_projects"),
                Prefetch("projects", queryset=invited_projects_qs, to_attr="invited_projects"),
            )
            .annotate(total_projects=Value(total_projects, output_field=IntegerField()))
            .annotate(has_projects=Value(has_projects, output_field=BooleanField()))
            .annotate(user_role=Value("member", output_field=CharField()))
            .annotate(user_is_owner=Value(False, output_field=BooleanField()))
        )
        member_ws = chain(member_ws, qs)

    # workspaces where the user is ws-guest with all its visible projects
    # or is not even a guest and only have invited projects
    user_pj_member = Q(memberships__user__id=user.id)
    user_invited_pj = Q(invitations__status=ProjectInvitationStatus.PENDING) & (
        Q(invitations__user_id=user.id) | (Q(invitations__user__isnull=True) & Q(invitations__email__iexact=user.email))
    )
    guest_ws_ids = (
        Project.objects.filter(user_pj_member | user_invited_pj)
        .exclude(workspace__memberships__user__id=user.id)  # user_not_ws_member
        .order_by("workspace_id")
        .distinct("workspace_id")
        .values_list("workspace_id", flat=True)
    )

    guest_ws: Iterable[Workspace] = Workspace.objects.none()
    for ws_id in guest_ws_ids:
        projects_ids = list(
            Project.objects.filter(
                workspace_id=ws_id,  # pj_in_workspace,
                memberships__user__id=user.id,  # user_pj_member
            )
            .order_by("-created_at")
            .values_list("id", flat=True)
        )
        total_projects = len(projects_ids)
        projects_qs = Project.objects.filter(id__in=projects_ids[:6]).order_by("-created_at")
        has_projects = Workspace.objects.get(id=ws_id).projects.count() > 0
        invited_projects_qs = Project.objects.filter(
            Q(invitations__user_id=user.id)
            | (Q(invitations__user__isnull=True) & Q(invitations__email__iexact=user.email)),
            invitations__status=ProjectInvitationStatus.PENDING,
            workspace_id=ws_id,
        )
        qs = (
            Workspace.objects.filter(id=ws_id)
            .prefetch_related(
                Prefetch("projects", queryset=projects_qs, to_attr="latest_projects"),
                Prefetch("projects", queryset=invited_projects_qs, to_attr="invited_projects"),
            )
            .annotate(total_projects=Value(total_projects, output_field=IntegerField()))
            .annotate(has_projects=Value(has_projects, output_field=BooleanField()))
            .annotate(user_role=Value("guest", output_field=CharField()))
            .annotate(user_is_owner=Value(False, output_field=BooleanField()))
        )
        guest_ws = chain(guest_ws, qs)

    result = list(chain(admin_ws, member_ws, guest_ws))
    return result


@sync_to_async
def get_user_workspace_overview(user: User, id: UUID) -> Workspace | None:
    # Generic annotations:
    has_projects = Exists(Project.objects.filter(workspace=OuterRef("pk")))
    user_is_owner = Case(When(owner_id=user.id, then=Value(True)), default=Value(False), output_field=BooleanField())
    user_role: Callable[[str], Value] = lambda role_name: Value(role_name, output_field=CharField())

    # Generic prefetch
    invited_projects_qs = Project.objects.filter(
        invitations__user_id=user.id, invitations__status=ProjectInvitationStatus.PENDING
    )

    # workspaces where the user is admin with all its projects
    try:
        total_projects: Subquery | Count = Count("projects")
        visible_project_ids_qs = (
            Project.objects.filter(workspace=OuterRef("workspace")).values_list("id", flat=True).order_by("-created_at")
        )
        latest_projects_qs = Project.objects.filter(id__in=Subquery(visible_project_ids_qs[:6])).order_by("-created_at")
        return (
            Workspace.objects.filter(
                id=id,
                memberships__user_id=user.id,  # user_is_ws_member
                memberships__role__is_admin=True,  # user_ws_role_is_admin
            )
            .prefetch_related(
                Prefetch("projects", queryset=latest_projects_qs, to_attr="latest_projects"),
                Prefetch("projects", queryset=invited_projects_qs, to_attr="invited_projects"),
            )
            .annotate(total_projects=Coalesce(total_projects, 0))
            .annotate(has_projects=has_projects)
            .annotate(user_role=user_role("admin"))
            .annotate(user_is_owner=user_is_owner)
            .get()
        )
    except Workspace.DoesNotExist:
        pass  # The workspace selected is not of this kind

    # workspaces where the user is ws-member with all its visible projects
    try:
        ws_allowed = ~Q(members__id=user.id) & Q(workspace_member_permissions__len__gt=0)
        pj_allowed = Q(members__id=user.id)
        total_projects = Subquery(
            Project.objects.filter(Q(workspace_id=OuterRef("id")))
            .filter((ws_allowed | pj_allowed))
            .values("workspace")
            .annotate(count=Count("*"))
            .values("count"),
            output_field=IntegerField(),
        )
        visible_project_ids_qs = (
            Project.objects.filter(Q(workspace=OuterRef("workspace")))
            .filter(ws_allowed | pj_allowed)
            .values_list("id", flat=True)
            .order_by("-created_at")
        )
        latest_projects_qs = Project.objects.filter(id__in=Subquery(visible_project_ids_qs[:6])).order_by("-created_at")
        return (
            Workspace.objects.filter(
                id=id,
                memberships__user__id=user.id,  # user_is_ws_member
                memberships__role__is_admin=False,  # user_ws_role_is_member
            )
            .prefetch_related(
                Prefetch("projects", queryset=latest_projects_qs, to_attr="latest_projects"),
                Prefetch("projects", queryset=invited_projects_qs, to_attr="invited_projects"),
            )
            .annotate(total_projects=Coalesce(total_projects, 0))
            .annotate(has_projects=has_projects)
            .annotate(user_role=user_role("member"))
            .annotate(user_is_owner=user_is_owner)
            .get()
        )
    except Workspace.DoesNotExist:
        pass  # The workspace selected is not of this kind

    # workspaces where the user is ws-guest with all its visible projects
    # or is not even a guest and only have invited projects
    try:
        user_not_ws_member = ~Q(members__id=user.id)
        user_pj_member = Q(projects__members__id=user.id)
        user_invited_pj = Q(
            projects__invitations__status=ProjectInvitationStatus.PENDING, projects__invitations__user_id=user.id
        )
        total_projects = Subquery(
            Project.objects.filter(
                Q(workspace_id=OuterRef("id")),
                members__id=user.id,
            )
            .values("workspace")
            .annotate(count=Count("*"))
            .values("count"),
            output_field=IntegerField(),
        )
        visible_project_ids_qs = (
            Project.objects.filter(
                Q(workspace=OuterRef("workspace")),
                members__id=user.id,
            )
            .order_by("-created_at")
            .values_list("id", flat=True)
        )
        latest_projects_qs = Project.objects.filter(id__in=Subquery(visible_project_ids_qs[:6])).order_by("-created_at")
        return (
            Workspace.objects.filter(user_not_ws_member & (user_pj_member | user_invited_pj), id=id)
            .distinct()
            .prefetch_related(
                Prefetch("projects", queryset=latest_projects_qs, to_attr="latest_projects"),
                Prefetch("projects", queryset=invited_projects_qs, to_attr="invited_projects"),
            )
            .annotate(total_projects=Coalesce(total_projects, 0))
            .annotate(has_projects=has_projects)
            .annotate(user_role=user_role("guest"))
            .annotate(user_is_owner=user_is_owner)
            .get()
        )
    except Workspace.DoesNotExist:
        return None  # There is no workspace with this id for this user
