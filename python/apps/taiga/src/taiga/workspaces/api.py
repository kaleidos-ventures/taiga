# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import Query
from taiga.base.api import AuthRequest
from taiga.base.api.permissions import check_permissions
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import HasPerm
from taiga.routers import routes
from taiga.workspaces import services as workspaces_services
from taiga.workspaces.models import Workspace
from taiga.workspaces.serializers import WorkspaceDetailSerializer, WorkspaceSerializer
from taiga.workspaces.validators import WorkspaceValidator

# PERMISSIONS
GET_WORKSPACE = HasPerm("view_workspace")


@routes.my.get(
    "/workspaces",
    name="my.workspaces.projects.list",
    summary="List my workspaces's projects",
    response_model=list[WorkspaceDetailSerializer],
)
async def list_my_workspaces(request: AuthRequest) -> list[Workspace]:
    """
    List the workspaces of the logged user.
    """
    return await workspaces_services.get_user_workspaces_overview(user=request.user)


@routes.workspaces.post(
    "",
    name="workspaces.post",
    summary="Create workspace",
    response_model=WorkspaceSerializer,
    responses=ERROR_422 | ERROR_403,
)
async def create_workspace(form: WorkspaceValidator, request: AuthRequest) -> Workspace:
    """
    Create a new workspace for the logged user.
    """
    workspace = await workspaces_services.create_workspace(name=form.name, color=form.color, owner=request.user)
    return await workspaces_services.get_workspace_detail(
        id=workspace.id, user_id=request.user.id  # type: ignore[return-value]
    )


@routes.workspaces.get(
    "/{slug}",
    name="workspaces.get",
    summary="Get workspace",
    response_model=WorkspaceSerializer,
    responses=ERROR_404 | ERROR_422 | ERROR_403,
)
async def get_workspace(
    request: AuthRequest, slug: str = Query("", description="the workspace slug(str)")
) -> Workspace:
    """
    Get workspace detail by slug.
    """
    workspace = await get_workspace_or_404(slug=slug)
    await check_permissions(permissions=GET_WORKSPACE, user=request.user, obj=workspace)
    return await workspaces_services.get_workspace_detail(
        id=workspace.id, user_id=request.user.id  # type: ignore[return-value]
    )


async def get_workspace_or_404(slug: str) -> Workspace:
    workspace = await workspaces_services.get_workspace(slug=slug)
    if workspace is None:
        raise ex.NotFoundError(f"Workspace {slug} does not exist")

    return workspace
