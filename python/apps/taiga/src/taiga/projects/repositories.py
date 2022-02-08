# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Optional

from asgiref.sync import sync_to_async
from django.core.files import File
from django.db.models import Q
from taiga.projects.models import Project, ProjectTemplate
from taiga.users.models import User
from taiga.workspaces.models import Workspace


@sync_to_async
def get_projects(workspace_slug: str) -> list[Project]:
    return list(
        Project.objects.prefetch_related("workspace").filter(workspace__slug=workspace_slug).order_by("-created_date")
    )


@sync_to_async
def get_workspace_projects_for_user(workspace_id: int, user_id: int) -> list[Project]:
    # projects of a workspace where:
    # - the user is not pj-member but the project allows to ws-members
    # - the user is pj-member and the role has access (has at least 1 permission)
    pj_in_workspace = Q(workspace_id=workspace_id)
    ws_allowed = ~Q(members__id=user_id) & Q(workspace_member_permissions__len__gt=0)
    pj_allowed = Q(members__id=user_id) & Q(memberships__role__permissions__len__gt=0)
    return list(
        Project.objects.prefetch_related("workspace").filter(pj_in_workspace & (ws_allowed | pj_allowed)).distinct()
    )


@sync_to_async
def create_project(
    workspace: Workspace,
    name: str,
    description: Optional[str],
    color: Optional[int],
    owner: User,
    template: ProjectTemplate,
    logo: Optional[File] = None,
) -> Project:

    project = Project.objects.create(
        name=name, description=description, workspace=workspace, color=color, owner=owner, logo=logo
    )
    # populate new project with default data
    template.apply_to_project(project)
    return project


@sync_to_async
def get_project(slug: str) -> Optional[Project]:
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
