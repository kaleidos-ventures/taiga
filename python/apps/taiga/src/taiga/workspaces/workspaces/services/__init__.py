# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any, cast
from uuid import UUID

from taiga.projects.projects import repositories as projects_repositories
from taiga.users.models import User
from taiga.workspaces.memberships import repositories as ws_memberships_repositories
from taiga.workspaces.memberships import services as ws_memberships_services
from taiga.workspaces.memberships.services import get_workspace_role_name
from taiga.workspaces.workspaces import events as workspaces_events
from taiga.workspaces.workspaces import repositories as workspaces_repositories
from taiga.workspaces.workspaces.models import Workspace
from taiga.workspaces.workspaces.serializers import WorkspaceDetailSerializer, WorkspaceSerializer
from taiga.workspaces.workspaces.serializers import services as serializers_services
from taiga.workspaces.workspaces.serializers.nested import WorkspaceNestedSerializer
from taiga.workspaces.workspaces.services import exceptions as ex

##########################################################
# create workspace
##########################################################


async def create_workspace(name: str, color: int, created_by: User) -> WorkspaceSerializer:
    workspace = await _create_workspace(name=name, color=color, created_by=created_by)
    return await get_workspace_detail(id=workspace.id, user_id=created_by.id)


#  TODO: review this method after the sampledata refactor
async def _create_workspace(name: str, color: int, created_by: User) -> Workspace:
    workspace = await workspaces_repositories.create_workspace(name=name, color=color, created_by=created_by)
    await ws_memberships_repositories.create_workspace_membership(user=created_by, workspace=workspace)
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
        user_role=await ws_memberships_services.get_workspace_role_name(workspace_id=id, user_id=user_id),
        total_projects=await projects_repositories.get_total_projects(
            filters={"workspace_id": id, "project_member_id": user_id}
        )
        if user_id
        else 0,
    )


async def get_workspace_nested(id: UUID, user_id: UUID | None) -> WorkspaceNestedSerializer:
    # TODO: this service should be improved
    workspace = cast(
        Workspace,
        await workspaces_repositories.get_workspace_summary(
            filters={"id": id},
        ),
    )
    return serializers_services.serialize_nested(
        workspace=workspace,
        user_role=await get_workspace_role_name(workspace_id=id, user_id=user_id),
    )


async def get_user_workspace(user: User, id: UUID) -> WorkspaceDetailSerializer | None:
    workspace = await workspaces_repositories.get_user_workspace_overview(user=user, id=id)
    if workspace:
        return serializers_services.serialize_workspace_detail(workspace=workspace)

    return None


##########################################################
# update workspace
##########################################################


async def update_workspace(workspace: Workspace, user: User, values: dict[str, Any] = {}) -> WorkspaceSerializer:
    updated_workspace = await _update_workspace(workspace=workspace, values=values)
    return await get_workspace_detail(id=updated_workspace.id, user_id=user.id)


async def _update_workspace(workspace: Workspace, values: dict[str, Any] = {}) -> Workspace:
    # Prevent hitting the database with an empty PATCH
    if not values:
        return workspace

    if "name" in values and values["name"] is None:
        raise ex.TaigaValidationError("Name cannot be null")

    return await workspaces_repositories.update_workspace(workspace=workspace, values=values)


##########################################################
# delete workspace
##########################################################


async def delete_workspace(workspace: Workspace, deleted_by: User) -> bool:
    ws_total_projects = await projects_repositories.get_total_projects(filters={"workspace_id": workspace.id})
    if ws_total_projects:
        raise ex.WorkspaceHasProjects(
            f"This workspace has {ws_total_projects} projects. Delete the projects and try again."
        )

    deleted = await workspaces_repositories.delete_workspaces(filters={"id": workspace.id})
    if deleted > 0:
        await workspaces_events.emit_event_when_workspace_is_deleted(workspace=workspace, deleted_by=deleted_by)
        return True

    return False
