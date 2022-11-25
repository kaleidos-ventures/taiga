# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Literal, TypedDict
from uuid import UUID

from asgiref.sync import sync_to_async
from taiga.base.db.models import File, Q, QuerySet
from taiga.projects.invitations.choices import ProjectInvitationStatus
from taiga.projects.projects.models import Project, ProjectTemplate
from taiga.projects.roles import repositories as pj_roles_repositories
from taiga.users.models import User
from taiga.workflows import repositories as workflows_repositories
from taiga.workspaces.workspaces.models import Workspace

DEFAULT_QUERYSET = Project.objects.all()
DEFAULT_PROJECT_TEMPLATE_QUERYSET = ProjectTemplate.objects.all()


##########################################################
# Project - filters and querysets
##########################################################


class ProjectListFilters(TypedDict, total=False):
    member_id: UUID
    workspace_id: UUID
    invitee_id: UUID
    invitation_status: ProjectInvitationStatus


def _apply_filters_to_project_queryset_list(
    qs: QuerySet[Project],
    filters: ProjectListFilters = {},
) -> QuerySet[Project]:
    filter_data = dict(filters.copy())

    if "invitation_status" in filter_data:
        filter_data["invitations__status"] = filter_data.pop("invitation_status")

    # filters for those projects where the user is invited to join (not yet a member)
    if "invitee_id" in filter_data:
        filter_data["invitations__user_id"] = filter_data.pop("invitee_id")

    # filters for those projects where the user is already a project (or a workspace) member
    if "member_id" in filter_data:
        member_id = filter_data.pop("member_id")
        ws_admin = Q(workspace__memberships__user_id=member_id) & Q(workspace__memberships__role__is_admin=True)
        ws_member_allowed = (
            Q(workspace__memberships__user_id=member_id)
            & ~Q(memberships__user_id=member_id)
            & Q(workspace_member_permissions__len__gt=0)
        )
        pj_member_allowed = Q(memberships__user_id=member_id)
        qs = qs.filter(ws_admin | ws_member_allowed | pj_member_allowed)

    qs = qs.filter(**filter_data)
    return qs


class ProjectFilters(TypedDict, total=False):
    id: UUID


def _apply_filters_to_project_queryset(
    qs: QuerySet[Project],
    filters: ProjectFilters = {},
) -> QuerySet[Project]:
    qs = qs.filter(**filters)
    return qs


ProjectPrefetchRelated = list[
    Literal[
        "workspace",
    ]
]


def _apply_prefetch_related_to_project_queryset(
    qs: QuerySet[Project],
    prefetch_related: ProjectPrefetchRelated,
) -> QuerySet[Project]:
    qs = qs.prefetch_related(*prefetch_related)
    return qs


ProjectOrderBy = list[
    Literal[
        "-created_at",
    ]
]


def _apply_order_by_to_project_queryset(
    qs: QuerySet[Project],
    order_by: ProjectOrderBy,
) -> QuerySet[Project]:
    qs = qs.order_by(*order_by)
    return qs


##########################################################
# Project - create project
##########################################################


@sync_to_async
def create_project(
    workspace: Workspace,
    name: str,
    owner: User,
    description: str | None = None,
    color: int = 1,
    logo: File | None = None,  # type: ignore
) -> Project:

    return Project.objects.create(
        name=name,
        description=description,
        workspace=workspace,
        color=color,
        owner=owner,
        logo=logo,
    )


##########################################################
# Project - get projects
##########################################################


@sync_to_async
def get_projects(
    filters: ProjectListFilters = {},
    prefetch_related: ProjectPrefetchRelated = [],
    order_by: ProjectOrderBy = ["-created_at"],
    offset: int | None = None,
    limit: int | None = None,
) -> list[Project]:
    qs = _apply_filters_to_project_queryset_list(qs=DEFAULT_QUERYSET, filters=filters)
    qs = _apply_prefetch_related_to_project_queryset(qs=qs, prefetch_related=prefetch_related)
    qs = _apply_order_by_to_project_queryset(order_by=order_by, qs=qs)
    qs = qs.distinct()

    if limit is not None and offset is not None:
        limit += offset

    return list(qs[offset:limit])


##########################################################
# Project - get project
##########################################################


@sync_to_async
def get_project(
    filters: ProjectFilters = {},
    prefetch_related: ProjectPrefetchRelated = ["workspace"],
) -> Project | None:
    qs = _apply_filters_to_project_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    qs = _apply_prefetch_related_to_project_queryset(qs=qs, prefetch_related=prefetch_related)

    try:
        return qs.get()
    except Project.DoesNotExist:
        return None


##########################################################
# Project - update project
##########################################################


@sync_to_async
def update_project(project: Project) -> Project:
    project.save()
    return project


##########################################################
# Project - misc
##########################################################


@sync_to_async
def get_total_projects(
    filters: ProjectListFilters = {},
) -> int:
    qs = _apply_filters_to_project_queryset_list(filters=filters, qs=DEFAULT_QUERYSET)
    return qs.distinct().count()


@sync_to_async
def project_is_in_premium_workspace(project: Project) -> bool:
    # TODO: this method should be solved in the service with a "select_related" query
    return project.workspace.is_premium


##########################################################
# Project Template - filters and querysets
##########################################################


class ProjectTemplateFilters(TypedDict, total=False):
    slug: str


def _apply_filters_to_project_template_queryset(
    qs: QuerySet[ProjectTemplate],
    filters: ProjectTemplateFilters = {},
) -> QuerySet[ProjectTemplate]:
    qs = qs.filter(**filters)
    return qs


##########################################################
# Project Template - get project template
##########################################################


@sync_to_async
def get_project_template(
    filters: ProjectTemplateFilters = {},
) -> ProjectTemplate | None:
    qs = _apply_filters_to_project_template_queryset(qs=DEFAULT_PROJECT_TEMPLATE_QUERYSET, filters=filters)

    try:
        return qs.get()
    except ProjectTemplate.DoesNotExist:
        return None


##########################################################
# Project Template - misc
##########################################################


def apply_template_to_project_sync(template: ProjectTemplate, project: Project) -> None:
    for role in template.roles:
        pj_roles_repositories.create_project_role_sync(
            name=role["name"],
            slug=role["slug"],
            order=role["order"],
            project=project,
            permissions=role["permissions"],
            is_admin=role["is_admin"],
        )

    for workflow in template.workflows:
        wf = workflows_repositories.create_workflow_sync(
            name=workflow["name"],
            slug=workflow["slug"],
            order=workflow["order"],
            project=project,
        )
        for status in workflow["statuses"]:
            workflows_repositories.create_workflow_status_sync(
                name=status["name"],
                slug=status["slug"],
                color=status["color"],
                order=status["order"],
                workflow=wf,
            )


apply_template_to_project = sync_to_async(apply_template_to_project_sync)
