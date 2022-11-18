# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import TypedDict
from uuid import UUID

from asgiref.sync import sync_to_async
from taiga.base.db.models import File, Q, QuerySet
from taiga.projects.invitations.choices import ProjectInvitationStatus
from taiga.projects.projects.models import Project, ProjectTemplate
from taiga.projects.roles.models import ProjectRole
from taiga.users.models import User
from taiga.workflows.models import Workflow, WorkflowStatus
from taiga.workspaces.workspaces.models import Workspace

##########################################################
# filters and querysets
##########################################################

DEFAULT_QUERYSET = Project.objects.all()


class ProjectListFilters(TypedDict, total=False):
    user_id: UUID
    workspace_id: UUID


def _apply_filters_to_queryset_list(
    qs: QuerySet[Project],
    filters: ProjectListFilters = {},
) -> QuerySet[Project]:
    filter_data = dict(filters.copy())

    if "user_id" in filter_data:
        user_id = filter_data.pop("user_id")
        ws_admin = Q(workspace__memberships__user_id=user_id) & Q(workspace__memberships__role__is_admin=True)
        ws_member_allowed = (
            Q(workspace__memberships__user_id=user_id)
            & ~Q(memberships__user_id=user_id)
            & Q(workspace_member_permissions__len__gt=0)
        )
        pj_member_allowed = Q(memberships__user_id=user_id)
        qs = qs.filter(ws_admin | ws_member_allowed | pj_member_allowed)

    qs = qs.filter(**filter_data)
    return qs


##########################################################
# create project
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

    project = Project.objects.create(
        name=name, description=description, workspace=workspace, color=color, owner=owner, logo=logo
    )
    return project


def apply_template_to_project_sync(template: ProjectTemplate, project: Project) -> None:
    for role in template.roles:
        ProjectRole.objects.create(
            name=role["name"],
            slug=role["slug"],
            order=role["order"],
            project=project,
            permissions=role["permissions"],
            is_admin=role["is_admin"],
        )

    for workflow in template.workflows:
        wf = Workflow.objects.create(
            name=workflow["name"],
            slug=workflow["slug"],
            order=workflow["order"],
            project=project,
        )
        for status in workflow["statuses"]:
            WorkflowStatus.objects.create(
                name=status["name"],
                slug=status["slug"],
                color=status["color"],
                order=status["order"],
                workflow=wf,
            )


apply_template_to_project = sync_to_async(apply_template_to_project_sync)

##########################################################


@sync_to_async
def get_projects(workspace_slug: str) -> list[Project]:
    return list(
        Project.objects.prefetch_related("workspace").filter(workspace__slug=workspace_slug).order_by("-created_at")
    )


@sync_to_async
def get_workspace_projects_for_user(workspace_id: UUID, user_id: UUID) -> list[Project]:
    # projects of a workspace where:
    # - the user is not pj-member, is ws-member and the project allows to ws-members
    # - the user is pj-member
    pj_in_workspace = Q(workspace_id=workspace_id)
    ws_allowed = (
        ~Q(members__id=user_id) & Q(workspace__members__id=user_id) & Q(workspace_member_permissions__len__gt=0)
    )
    pj_allowed = Q(members__id=user_id)
    return list(
        Project.objects.prefetch_related("workspace")
        .filter(pj_in_workspace & (ws_allowed | pj_allowed))
        .order_by("-created_at")
        .distinct()
    )


@sync_to_async
def get_workspace_invited_projects_for_user(workspace_id: UUID, user_id: UUID) -> list[Project]:
    return list(
        Project.objects.filter(
            workspace_id=workspace_id, invitations__user_id=user_id, invitations__status=ProjectInvitationStatus.PENDING
        )
    )


@sync_to_async
def get_project(slug: str) -> Project | None:
    try:
        return Project.objects.prefetch_related("workspace").get(slug=slug)
    except Project.DoesNotExist:
        return None


@sync_to_async
def get_project_owner(project: Project) -> User:
    return project.owner


@sync_to_async
def get_template(slug: str) -> ProjectTemplate:
    return ProjectTemplate.objects.get(slug=slug)


@sync_to_async
def update_project_public_permissions(project: Project, permissions: list[str]) -> list[str]:
    project.public_permissions = permissions
    project.save()
    return project.public_permissions


@sync_to_async
def update_project_workspace_member_permissions(project: Project, permissions: list[str]) -> list[str]:
    project.workspace_member_permissions = permissions
    project.save()
    return project.workspace_member_permissions


@sync_to_async
def project_is_in_premium_workspace(project: Project) -> bool:
    return project.workspace.is_premium


##########################################################
# misc
##########################################################


@sync_to_async
def get_total_projects(
    filters: ProjectListFilters = {},
) -> int:
    qs = _apply_filters_to_queryset_list(filters=filters, qs=DEFAULT_QUERYSET)
    return qs.distinct().count()
