# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from uuid import UUID

from asgiref.sync import sync_to_async
from taiga.base.db.models import File, Q
from taiga.invitations.choices import ProjectInvitationStatus
from taiga.projects.models import Project, ProjectRole, ProjectTemplate
from taiga.users.models import User
from taiga.workflows.models import Workflow, WorkflowStatus
from taiga.workspaces.models import Workspace


@sync_to_async
def get_projects(workspace_slug: str) -> list[Project]:
    return list(
        Project.objects.prefetch_related("workspace").filter(workspace__slug=workspace_slug).order_by("-created_at")
    )


@sync_to_async
def get_workspace_projects_for_user(workspace_id: UUID, user_id: UUID) -> list[Project]:
    # projects of a workspace where:
    # - the user is not pj-member but the project allows to ws-members
    # - the user is pj-member
    pj_in_workspace = Q(workspace_id=workspace_id)
    ws_allowed = ~Q(members__id=user_id) & Q(workspace_member_permissions__len__gt=0)
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
def update_project_public_permissions(
    project: Project, permissions: list[str], anon_permissions: list[str]
) -> list[str]:
    project.public_permissions = permissions
    project.anon_permissions = anon_permissions
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
