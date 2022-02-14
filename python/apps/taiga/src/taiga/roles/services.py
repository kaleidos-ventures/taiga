# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
from typing import Optional

from taiga.exceptions import services as ex
from taiga.permissions import services as permissions_services
from taiga.projects.models import Project
from taiga.roles import repositories as roles_repositories
from taiga.roles.models import Membership, Role, WorkspaceMembership
from taiga.users.models import User
from taiga.workspaces.models import Workspace


async def get_project_roles(project: Project) -> list[Role]:
    return await roles_repositories.get_project_roles(project)


async def get_project_role(project: Project, slug: str) -> Optional[Role]:
    return await roles_repositories.get_project_role(project=project, slug=slug)


async def update_role_permissions(role: Role, permissions: list[str]) -> Role:
    if role.is_admin:
        raise ex.NonEditableRoleError()

    if not permissions_services.permissions_are_valid(permissions):
        raise ex.NotValidPermissionsSetError()

    if not permissions_services.permissions_are_compatible(permissions):
        raise ex.IncompatiblePermissionsSetError()

    return await roles_repositories.update_role_permissions(role=role, permissions=permissions)


async def get_user_project_membership(user: User, project: Project, cache: str = "user") -> Membership:
    """
    cache param determines how memberships are calculated
    trying to reuse the existing data in cache
    """
    return await roles_repositories.get_user_project_membership(user=user, project=project, cache=cache)


async def get_user_workspace_membership(user: User, workspace: Workspace, cache: str = "user") -> WorkspaceMembership:
    """
    cache param determines how memberships are calculated
    trying to reuse the existing data in cache
    """
    return await roles_repositories.get_user_workspace_membership(user=user, workspace=workspace, cache=cache)
