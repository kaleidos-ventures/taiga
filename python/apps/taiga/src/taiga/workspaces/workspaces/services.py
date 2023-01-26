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
from taiga.workspaces.workspaces.serializers import WorkspaceDetailSerializer, WorkspaceSerializer
from taiga.workspaces.workspaces.serializers import services as serializers_services
from taiga.workspaces.workspaces.serializers.nested import WorkspaceNestedSerializer

##########################################################
# create workspace
##########################################################


async def create_workspace_api(name: str, color: int, owner: User) -> WorkspaceSerializer:
    workspace = await create_workspace(name=name, color=color, owner=owner)
    return await get_workspace_detail(id=workspace.id, user_id=owner.id)


#  TODO: review this method after the sample_data refactor
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


async def list_user_workspaces(user: User) -> list[WorkspaceDetailSerializer]:
    return [
        serializers_services.serialize_workspace_detail(workspace=workspace)
        for workspace in await workspaces_repositories.list_user_workspaces_overview(user=user)
    ]


##########################################################
# get workspace
##########################################################


async def get_workspace(id: UUID) -> Workspace | None:
    return await workspaces_repositories.get_workspace(filters={"id": id})


async def get_workspace_detail(id: UUID, user_id: UUID | None) -> WorkspaceSerializer:
    workspace = cast(
        Workspace,
        await workspaces_repositories.get_workspace_detail(filters={"id": id}, user_id=user_id),
    )
    return serializers_services.serialize_workspace(
        workspace=workspace,
        user_role=await ws_roles_services.get_workspace_role_name(workspace_id=id, user_id=user_id),
        total_projects=await projects_repositories.get_total_projects(
            filters={"workspace_id": id, "project_or_workspace_member_id": user_id}
        ),
    )


async def get_workspace_nested(id: UUID, user_id: UUID | None) -> WorkspaceNestedSerializer:
    # TODO: this service should be improved
    user_workspace_role_name = await ws_roles_services.get_workspace_role_name(workspace_id=id, user_id=user_id)
    workspace = cast(
        Workspace,
        await workspaces_repositories.get_workspace_summary(
            filters={"id": id},
        ),
    )

    return serializers_services.serialize_nested(workspace=workspace, user_role=user_workspace_role_name)


async def get_user_workspace(user: User, id: UUID) -> WorkspaceDetailSerializer | None:
    workspace = await workspaces_repositories.get_user_workspace_overview(user=user, id=id)
    if workspace:
        return serializers_services.serialize_workspace_detail(workspace=workspace)
    return None
