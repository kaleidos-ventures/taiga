# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import cast
from uuid import UUID

from taiga.permissions import choices
from taiga.projects.projects import repositories as projects_repositories
from taiga.users.models import User
from taiga.workspaces.memberships import repositories as ws_memberships_repositories
from taiga.workspaces.roles import repositories as ws_roles_repositories
from taiga.workspaces.roles import services as ws_roles_services
from taiga.workspaces.workspaces import repositories as workspaces_repositories
from taiga.workspaces.workspaces.models import Workspace
from taiga.workspaces.workspaces.serializers.related import WorkspaceSummarySerializer

##########################################################
# create workspace
##########################################################


async def create_workspace(name: str, color: int, owner: User) -> Workspace:
    workspace = await workspaces_repositories.create_workspace(name=name, color=color, owner=owner)
    role = await ws_roles_repositories.create_workspace_role(
        name="Administrator",
        slug="admin",
        permissions=choices.WorkspacePermissions.values,
        workspace=workspace,
        is_admin=True,
    )
    await ws_memberships_repositories.create_workspace_membership(user=owner, workspace=workspace, role=role)
    return workspace


##########################################################
# list workspace
##########################################################


async def list_user_workspaces(user: User) -> list[Workspace]:
    return await workspaces_repositories.list_user_workspaces_overview(user=user)


##########################################################
# get workspace
##########################################################


async def get_workspace(id: UUID) -> Workspace | None:
    return await workspaces_repositories.get_workspace(filters={"id": id})


async def get_workspace_detail(id: UUID, user_id: UUID | None) -> Workspace | None:
    user_workspace_role_name = await ws_roles_services.get_workspace_role_name(workspace_id=id, user_id=user_id)
    user_projects_count = await projects_repositories.get_total_projects(
        filters={"workspace_id": id, "project_or_workspace_member_id": user_id},
    )
    return await workspaces_repositories.get_workspace_detail(
        filters={"id": id},
        user_id=user_id,
        user_workspace_role_name=user_workspace_role_name,
        user_projects_count=user_projects_count,
    )


# TODO: change this name to `get_workspace_nested`
async def get_workspace_summary(id: UUID, user_id: UUID | None) -> WorkspaceSummarySerializer:
    # TODO: this service should be improved
    user_workspace_role_name = await ws_roles_services.get_workspace_role_name(workspace_id=id, user_id=user_id)
    workspace = cast(
        Workspace,
        await workspaces_repositories.get_workspace_summary(
            filters={"id": id},
        ),
    )
    # TODO: take this code to a workspaces/serializers/services.py
    return WorkspaceSummarySerializer(
        id=workspace.id,
        name=workspace.name,
        slug=workspace.slug,
        user_role=user_workspace_role_name,
        is_premium=workspace.is_premium,
    )


async def get_user_workspace(user: User, id: UUID) -> Workspace | None:
    return await workspaces_repositories.get_user_workspace_overview(user=user, id=id)
