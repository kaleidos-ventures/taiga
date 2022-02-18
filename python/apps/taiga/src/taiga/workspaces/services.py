# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.permissions import choices
from taiga.roles import repositories as roles_repositories
from taiga.users.models import User
from taiga.workspaces import repositories as workspaces_repositories
from taiga.workspaces.models import Workspace


async def get_user_workspaces_with_latest_projects(user: User) -> list[Workspace]:
    return await workspaces_repositories.get_user_workspaces_with_latest_projects(user=user)


async def get_workspace(slug: str) -> Workspace | None:
    return await workspaces_repositories.get_workspace(slug=slug)


async def get_workspace_detail(id: int, user_id: int) -> Workspace | None:
    return await workspaces_repositories.get_workspace_detail(id=id, user_id=user_id)


async def create_workspace(name: str, color: int, owner: User) -> Workspace:
    workspace = await workspaces_repositories.create_workspace(name=name, color=color, owner=owner)
    workspace_role = await roles_repositories.create_workspace_role(
        name="Administrators",
        slug="admin",
        permissions=choices.WORKSPACE_PERMISSIONS,
        workspace=workspace,
        is_admin=True,
    )
    await roles_repositories.create_workspace_membership(user=owner, workspace=workspace, workspace_role=workspace_role)
    return workspace
