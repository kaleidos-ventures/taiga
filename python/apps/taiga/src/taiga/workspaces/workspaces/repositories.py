# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from itertools import chain
from typing import Any, Iterable, Literal, TypedDict
from uuid import UUID

from asgiref.sync import sync_to_async
from taiga.base.db.models import (
    BooleanField,
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
)
from taiga.base.utils.datetime import aware_utcnow
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
    workspace_member_id: UUID
    num_members: int
    has_projects: bool


def _apply_filters_to_queryset(
    qs: QuerySet[Workspace],
    filters: WorkspaceFilters = {},
) -> QuerySet[Workspace]:
    filter_data = dict(filters.copy())

    # filters for those workspace where the user is already a workspace member
    if "workspace_member_id" in filter_data:
        filter_data["memberships__user_id"] = filter_data.pop("workspace_member_id")

    if "num_members" in filter_data:
        qs = qs.annotate(num_members=Count("members"))

    if "has_projects" in filter_data:
        if filter_data.pop("has_projects"):
            qs = qs.filter(~Q(projects=None))
        else:
            qs = qs.filter(Q(projects=None))

    return qs.filter(**filter_data)


WorkspacePrefetchRelated = list[Literal["projects",]]


def _apply_prefetch_related_to_queryset(
    qs: QuerySet[Workspace],
    prefetch_related: WorkspacePrefetchRelated,
) -> QuerySet[Workspace]:
    return qs.prefetch_related(*prefetch_related)


WorkspaceOrderBy = list[Literal["-created_at",]]


def _apply_order_by_to_queryset(
    qs: QuerySet[Workspace],
    order_by: WorkspaceOrderBy,
) -> QuerySet[Workspace]:
    return qs.order_by(*order_by)


##########################################################
# create workspace
##########################################################


@sync_to_async
def create_workspace(name: str, color: int, created_by: User) -> Workspace:
    return Workspace.objects.create(name=name, color=color, created_by=created_by)


##########################################################
# list
##########################################################


@sync_to_async
def list_workspaces(
    filters: WorkspaceFilters = {},
    prefetch_related: WorkspacePrefetchRelated = [],
    order_by: WorkspaceOrderBy = ["-created_at"],
) -> list[Workspace]:
    qs = _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    qs = _apply_prefetch_related_to_queryset(qs=qs, prefetch_related=prefetch_related)
    qs = _apply_order_by_to_queryset(order_by=order_by, qs=qs)
    qs = qs.distinct()

    return list(qs)


@sync_to_async
def list_user_workspaces_overview(user: User) -> list[Workspace]:
    # workspaces where the user is ws-member with all its projects
    ws_member_ids = (
        Workspace.objects.filter(
            memberships__user_id=user.id,  # user_is_ws_member
        )
        .order_by("-created_at")
        .values_list("id", flat=True)
    )
    member_ws: Iterable[Workspace] = Workspace.objects.none()
    for ws_id in ws_member_ids:
        projects_ids = list(
            Project.objects.filter(workspace_id=ws_id)  # pj_in_workspace
            .order_by("-created_at")
            .values_list("id", flat=True)
        )
        total_projects = len(projects_ids)
        projects_qs = Project.objects.filter(id__in=projects_ids[:12]).order_by("-created_at")
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
        projects_qs = Project.objects.filter(id__in=projects_ids[:12]).order_by("-created_at")
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
        )
        guest_ws = chain(guest_ws, qs)

    result = list(chain(member_ws, member_ws, guest_ws))
    return result


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
    filters: WorkspaceFilters = {},
) -> Workspace | None:
    qs = _apply_filters_to_queryset(filters=filters, qs=DEFAULT_QUERYSET)
    qs = qs.annotate(has_projects=Exists(Project.objects.filter(workspace=OuterRef("pk"))))

    try:
        return qs.get()
    except Workspace.DoesNotExist:
        return None


@sync_to_async
def get_workspace_summary(
    filters: WorkspaceFilters = {},
) -> Workspace | None:
    qs = _apply_filters_to_queryset(filters=filters, qs=DEFAULT_QUERYSET)
    try:
        return qs.get()
    except Workspace.DoesNotExist:
        return None


@sync_to_async
def get_user_workspace_overview(user: User, id: UUID) -> Workspace | None:
    # Generic annotations:
    has_projects = Exists(Project.objects.filter(workspace=OuterRef("pk")))

    # Generic prefetch
    invited_projects_qs = Project.objects.filter(
        invitations__user_id=user.id, invitations__status=ProjectInvitationStatus.PENDING
    )

    # workspaces where the user is member
    try:
        total_projects: Subquery | Count = Count("projects")
        visible_project_ids_qs = (
            Project.objects.filter(workspace=OuterRef("workspace")).values_list("id", flat=True).order_by("-created_at")
        )
        latest_projects_qs = Project.objects.filter(id__in=Subquery(visible_project_ids_qs[:12])).order_by(
            "-created_at"
        )
        return (
            Workspace.objects.filter(
                id=id,
                memberships__user_id=user.id,  # user_is_ws_member
            )
            .prefetch_related(
                Prefetch("projects", queryset=latest_projects_qs, to_attr="latest_projects"),
                Prefetch("projects", queryset=invited_projects_qs, to_attr="invited_projects"),
            )
            .annotate(total_projects=Coalesce(total_projects, 0))
            .annotate(has_projects=has_projects)
            .annotate(user_role=Value("member", output_field=CharField()))
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
        latest_projects_qs = Project.objects.filter(id__in=Subquery(visible_project_ids_qs[:12])).order_by(
            "-created_at"
        )
        return (
            Workspace.objects.filter(user_not_ws_member & (user_pj_member | user_invited_pj), id=id)
            .distinct()
            .prefetch_related(
                Prefetch("projects", queryset=latest_projects_qs, to_attr="latest_projects"),
                Prefetch("projects", queryset=invited_projects_qs, to_attr="invited_projects"),
            )
            .annotate(total_projects=Coalesce(total_projects, 0))
            .annotate(has_projects=has_projects)
            .annotate(user_role=Value("guest", output_field=CharField()))
            .get()
        )
    except Workspace.DoesNotExist:
        return None  # There is no workspace with this id for this user


##########################################################
# update workspace
##########################################################


@sync_to_async
def update_workspace(workspace: Workspace, values: dict[str, Any] = {}) -> Workspace:
    for attr, value in values.items():
        setattr(workspace, attr, value)

    workspace.modified_at = aware_utcnow()
    workspace.save()
    return workspace


##########################################################
# delete workspace
##########################################################


@sync_to_async
def delete_workspaces(filters: WorkspaceFilters = {}) -> int:
    qs = _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    count, _ = qs.delete()
    return count


##########################################################
# misc
##########################################################


@sync_to_async
def list_workspace_projects(workspace: Workspace) -> list[Project]:
    return list(workspace.projects.all().order_by("-created_at"))
