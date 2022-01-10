# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
from typing import List

from taiga.projects.models import Project
from taiga.roles.models import Membership, Role, WorkspaceMembership, WorkspaceRole
from taiga.users.models import User
from taiga.workspaces.models import Workspace


def get_project_role(project: Project, slug: str) -> Role:
    try:
        return project.roles.get(slug=slug)
    except Role.DoesNotExist:
        return None


def get_project_roles(project: Project) -> List[Role]:
    return project.roles.all()


def get_first_role(project: Project) -> Role:
    return project.roles.first()


def get_num_members_by_role_id(role_id: int) -> int:
    if role_id:
        return Membership.objects.filter(role_id=role_id).count()

    return 0


def update_role_permissions(role: Role, permissions: List[str]) -> Role:
    role.permissions = permissions
    role.save()
    return role


def create_membership(user: User, project: Project, role: Role, email: str) -> Membership:
    return Membership.objects.create(user=user, project=project, role=role, email=email)


def create_workspace_role(
    name: str, slug: str, permissions: List[str], workspace: Workspace, is_admin: bool = False
) -> Workspace:
    return WorkspaceRole.objects.create(
        name="Administrators",
        slug="admin",
        permissions=permissions,
        workspace=workspace,
        is_admin=True,
    )


def create_workspace_membership(user: User, workspace: Workspace, workspace_role: WorkspaceRole) -> WorkspaceMembership:
    return WorkspaceMembership.objects.create(user=user, workspace=workspace, workspace_role=workspace_role)
