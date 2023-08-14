# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC
from uuid import UUID

from fastapi import status
from taiga.base.api import AuthRequest, responses
from taiga.base.api.permissions import check_permissions
from taiga.base.validators import B64UUID
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_400, ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import HasPerm, IsAuthenticated, IsWorkspaceMember
from taiga.routers import routes
from taiga.workspaces.workspaces import services as workspaces_services
from taiga.workspaces.workspaces.api.validators import UpdateWorkspaceValidator, WorkspaceValidator
from taiga.workspaces.workspaces.models import Workspace
from taiga.workspaces.workspaces.serializers import WorkspaceDetailSerializer, WorkspaceSerializer

# PERMISSIONS
LIST_MY_WORKSPACES = IsAuthenticated()
GET_MY_WORKSPACE = IsAuthenticated()
GET_WORKSPACE = HasPerm("view_workspace")
DELETE_WORKSPACE = IsWorkspaceMember()
UPDATE_WORKSPACE = IsWorkspaceMember()

# HTTP 200 RESPONSES
WORKSPACE_200 = responses.http_status_200(model=WorkspaceSerializer)
WORKSPACE_DETAIL_200 = responses.http_status_200(model=WorkspaceDetailSerializer)
LIST_WORKSPACE_DETAIL_200 = responses.http_status_200(model=list[WorkspaceDetailSerializer])


##########################################################
# create workspace
##########################################################


@routes.workspaces.post(
    "/workspaces",
    name="workspaces.post",
    summary="Create workspace",
    responses=WORKSPACE_DETAIL_200 | ERROR_403 | ERROR_422,
    response_model=None,
)
async def create_workspace(form: WorkspaceValidator, request: AuthRequest) -> WorkspaceSerializer:
    """
    Create a new workspace for the logged user.
    """
    return await workspaces_services.create_workspace(name=form.name, color=form.color, created_by=request.user)


##########################################################
# list workspaces
##########################################################


@routes.workspaces.get(
    "/my/workspaces",
    name="my.workspaces.list",
    summary="List the overview of the workspaces to which I belong",
    responses=LIST_WORKSPACE_DETAIL_200 | ERROR_403,
    response_model=None,
)
async def list_my_workspaces(request: AuthRequest) -> list[WorkspaceDetailSerializer]:
    """
    List the workspaces overviews of the logged user.
    """
    await check_permissions(permissions=LIST_MY_WORKSPACES, user=request.user, obj=None)
    return await workspaces_services.list_user_workspaces(user=request.user)


##########################################################
# get workspace
##########################################################


@routes.workspaces.get(
    "/workspaces/{id}",
    name="workspaces.get",
    summary="Get workspace",
    responses=WORKSPACE_DETAIL_200 | ERROR_403 | ERROR_404 | ERROR_422,
    response_model=None,
)
async def get_workspace(id: B64UUID, request: AuthRequest) -> WorkspaceSerializer:
    """
    Get workspace detail by id.
    """
    workspace = await get_workspace_or_404(id=id)
    await check_permissions(permissions=GET_WORKSPACE, user=request.user, obj=workspace)
    return await workspaces_services.get_workspace_detail(id=workspace.id, user_id=request.user.id)


@routes.workspaces.get(
    "/my/workspaces/{id}",
    name="my.workspaces.get",
    summary="Get the overview of a workspace to which I belong",
    responses=WORKSPACE_DETAIL_200 | ERROR_403 | ERROR_404 | ERROR_422,
    response_model=None,
)
async def get_my_workspace(id: B64UUID, request: AuthRequest) -> WorkspaceDetailSerializer:
    """
    Get the workspaces overview for the logged user.
    """
    await check_permissions(permissions=GET_MY_WORKSPACE, user=request.user, obj=None)
    workspace_overview = await workspaces_services.get_user_workspace(user=request.user, id=id)
    if workspace_overview is None:
        raise ex.NotFoundError(f"Workspace {id} does not exist")
    return workspace_overview


##########################################################
# update workspace
##########################################################


@routes.workspaces.patch(
    "/workspaces/{id}",
    name="workspace.update",
    summary="Update workspace",
    responses=WORKSPACE_200 | ERROR_400 | ERROR_403 | ERROR_404 | ERROR_422,
    response_model=None,
)
async def update_workspace(
    id: B64UUID,
    request: AuthRequest,
    form: UpdateWorkspaceValidator,
) -> WorkspaceSerializer:
    """
    Update workspace
    """
    workspace = await get_workspace_or_404(id)
    await check_permissions(permissions=UPDATE_WORKSPACE, user=request.user, obj=workspace)

    values = form.dict(exclude_unset=True)
    return await workspaces_services.update_workspace(workspace=workspace, user=request.user, values=values)


##########################################################
# delete workspace
##########################################################


@routes.workspaces.delete(
    "/workspaces/{id}",
    name="workspace.delete",
    summary="Delete workspace",
    responses=ERROR_400 | ERROR_403 | ERROR_404 | ERROR_422,
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_workspace(id: B64UUID, request: AuthRequest) -> None:
    """
    Delete a workspace
    """
    workspace = await get_workspace_or_404(id=id)
    await check_permissions(permissions=DELETE_WORKSPACE, user=request.user, obj=workspace)

    await workspaces_services.delete_workspace(workspace=workspace, deleted_by=request.user)


##########################################################
# misc
##########################################################


async def get_workspace_or_404(id: UUID) -> Workspace:
    workspace = await workspaces_services.get_workspace(id=id)
    if workspace is None:
        raise ex.NotFoundError(f"Workspace {id} does not exist")

    return workspace
