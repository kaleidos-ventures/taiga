# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import Query
from taiga.auth.routing import AuthAPIRouter
from taiga.base.api import Request
from taiga.base.api.permissions import check_permissions
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import HasPerm
from taiga.workspaces import services as workspaces_services
from taiga.workspaces.models import Workspace
from taiga.workspaces.serializers import WorkspaceSerializer, WorkspaceSummarySerializer
from taiga.workspaces.validators import WorkspaceValidator

metadata = {
    "name": "workspaces",
    "description": "Endpoint for workspaces resources.",
}
my_metadata = {"name": "my", "description": "Endpoints for logged-in user's resources."}
router = AuthAPIRouter(prefix="/workspaces", tags=["workspaces"])
router_my = AuthAPIRouter(prefix="/my", tags=["my"])

# PERMISSIONS
GET_WORKSPACE = HasPerm("view_workspace")


@router_my.get(
    "/workspaces",
    name="my.workspaces.projects.list",
    summary="List my workspaces's projects",
    response_model=list[WorkspaceSummarySerializer],
)
async def list_my_workspaces(request: Request) -> list[WorkspaceSummarySerializer]:
    """
    List the workspaces of the logged user.
    """
    workspaces = await workspaces_services.get_user_workspaces_with_latest_projects(user=request.user)
    return WorkspaceSummarySerializer.from_queryset(workspaces)


@router.post(
    "",
    name="workspaces.post",
    summary="Create workspace",
    response_model=WorkspaceSerializer,
    responses=ERROR_422 | ERROR_403,
)
async def create_workspace(form: WorkspaceValidator, request: Request) -> WorkspaceSerializer:
    """
    Create a new workspace for the logged user.
    """
    workspace = await workspaces_services.create_workspace(name=form.name, color=form.color, owner=request.user)
    return WorkspaceSerializer.from_orm(workspace)


@router.get(
    "/{slug}",
    name="workspaces.get",
    summary="Get workspace",
    response_model=WorkspaceSerializer,
    responses=ERROR_404 | ERROR_422 | ERROR_403,
)
async def get_workspace(
    request: Request, slug: str = Query("", description="the workspace slug(str)")
) -> WorkspaceSerializer:
    """
    Get workspace detail by slug.
    """
    workspace = await get_workspace_or_404(slug=slug)
    await check_permissions(permissions=GET_WORKSPACE, user=request.user, obj=workspace)
    return WorkspaceSerializer.from_orm(workspace)


async def get_workspace_or_404(slug: str) -> Workspace:
    workspace = await workspaces_services.get_workspace(slug=slug)
    if workspace is None:
        raise ex.NotFoundError(f"Workspace {slug} does not exist")

    return workspace
