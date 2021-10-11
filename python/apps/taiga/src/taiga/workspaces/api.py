# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import List

from fastapi import APIRouter, Query
from taiga.base.api import Request
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_401, ERROR_404, ERROR_422
from taiga.workspaces import services as workspaces_services
from taiga.workspaces.serializers import WorkspaceSerializer
from taiga.workspaces.validators import WorkspaceValidator

metadata = {
    "name": "workspaces",
    "description": "Endpoint for workspaces resources.",
}

router = APIRouter(prefix="/workspaces", tags=["workspaces"], responses=ERROR_401)


@router.get(
    "",
    name="workspaces.list",
    summary="List workspaces",
    response_model=List[WorkspaceSerializer],
)
def list_workspaces(request: Request) -> List[WorkspaceSerializer]:
    """
    List the workspaces of the logged user.
    """
    workspaces = workspaces_services.get_workspaces(owner=request.user)
    return WorkspaceSerializer.from_queryset(workspaces)


@router.post(
    "", name="workspaces.post", summary="Create workspace", response_model=WorkspaceSerializer, responses=ERROR_422
)
def create_workspace(form: WorkspaceValidator, request: Request) -> WorkspaceSerializer:
    """
    Create a new workspace for the logged user.
    """
    workspace = workspaces_services.create_workspace(name=form.name, color=form.color, owner=request.user)
    return WorkspaceSerializer.from_orm(workspace)


@router.get(
    "/{workspace_slug}",
    name="workspaces.get",
    summary="Get workspace",
    response_model=WorkspaceSerializer,
    responses=ERROR_404 | ERROR_422,
)
def get_workspace(workspace_slug: str = Query(None, description="the workspace slug(str)")) -> WorkspaceSerializer:
    """
    Get workspace detail by slug.
    """
    workspace = workspaces_services.get_workspace(workspace_slug)

    if workspace is None:
        raise ex.NotFoundError()

    return WorkspaceSerializer.from_orm(workspace)
