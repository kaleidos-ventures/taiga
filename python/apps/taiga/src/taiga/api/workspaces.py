# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import List

from fastapi import APIRouter, Depends, Query
from taiga.dependencies.users import get_current_user
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_401, ERROR_404, ERROR_422
from taiga.models.users import User
from taiga.serializers.workspaces import WorkspaceSerializer
from taiga.services import workspaces as workspaces_services
from taiga.validators.workspaces import WorkspaceValidator

metadata = {
    "name": "workspaces",
    "description": "Endpoint for workspaces resources.",
}

router = APIRouter(prefix="/workspaces", tags=["workspaces"], responses=ERROR_401)


@router.get(
    "",
    name="workspaces.list",
    summary="Get the workspaces of the logged user",
    response_model=List[WorkspaceSerializer],
)
def get_workspaces_by_owner(user: User = Depends(get_current_user)) -> List[WorkspaceSerializer]:
    workspaces = workspaces_services.get_workspaces(owner=user)
    return WorkspaceSerializer.from_queryset(workspaces)


@router.post(
    "", name="workspace.post", summary="Post workspace", response_model=WorkspaceSerializer, responses=ERROR_422
)
def create_workspace(form: WorkspaceValidator, user: User = Depends(get_current_user)) -> WorkspaceSerializer:
    workspace = workspaces_services.create_workspace(name=form.name, color=form.color, owner=user)
    return WorkspaceSerializer.from_orm(workspace)


@router.get(
    "/{workspace_slug}",
    name="workspaces.get",
    summary="Get workspace details",
    response_model=WorkspaceSerializer,
    responses=ERROR_404 | ERROR_422,
)
def get_workspace(workspace_slug: str = Query(None, description="the workspace slug(str)")) -> WorkspaceSerializer:
    """
    Get workspace detail by slug
    """
    workspace = workspaces_services.get_workspace(workspace_slug)

    if workspace is None:
        raise ex.NotFoundError()

    return WorkspaceSerializer.from_orm(workspace)
