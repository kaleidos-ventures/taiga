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
from taiga.workspaces.serializers import WorkspaceSerializer, WorkspaceSummarySerializer
from taiga.workspaces.validators import WorkspaceValidator

metadata = {
    "name": "workspaces",
    "description": "Endpoint for workspaces resources.",
}

router = AuthAPIRouter(prefix="/workspaces", tags=["workspaces"])

# PERMISSIONS
GET_WORKSPACE = HasPerm("view_workspace")


@router.get(
    "",
    name="workspaces.list",
    summary="List workspaces",
    response_model=list[WorkspaceSummarySerializer],
)
def list_workspaces(request: Request) -> list[WorkspaceSummarySerializer]:
    """
    List the workspaces of the logged user.
    """
    # TODO - ahora mismo solo devuelve los WS en los que eres owner
    # a futuro tendrá que devolver también los WS que tengan algún proyecto en el que eres miembro
    # aunque no puedas ver el detalle de ese WS
    workspaces = workspaces_services.get_workspaces(owner=request.user)
    return WorkspaceSummarySerializer.from_queryset(workspaces)


@router.post(
    "",
    name="workspaces.post",
    summary="Create workspace",
    response_model=WorkspaceSerializer,
    responses=ERROR_422 | ERROR_403,
)
def create_workspace(form: WorkspaceValidator, request: Request) -> WorkspaceSerializer:
    """
    Create a new workspace for the logged user.
    """
    workspace = workspaces_services.create_workspace(name=form.name, color=form.color, owner=request.user)
    return WorkspaceSerializer.from_orm(workspace)


@router.get(
    "/{slug}",
    name="workspaces.get",
    summary="Get workspace",
    response_model=WorkspaceSerializer,
    responses=ERROR_404 | ERROR_422 | ERROR_403,
)
def get_workspace(
    request: Request, slug: str = Query("", description="the workspace slug(str)")
) -> WorkspaceSerializer:
    """
    Get workspace detail by slug.
    """
    workspace = workspaces_services.get_workspace(slug=slug)

    if workspace is None:
        raise ex.NotFoundError(f"Workspace {slug} does not exist")

    check_permissions(permissions=GET_WORKSPACE, user=request.user, obj=workspace)

    return WorkspaceSerializer.from_orm(workspace)
