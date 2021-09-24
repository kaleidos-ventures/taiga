# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import List

from fastapi import APIRouter, HTTPException, Query
from taiga.exceptions import api as ex
from taiga.serializers.workspaces import WorkspaceSerializer
from taiga.services import workspaces as workspaces_services
from taiga.validators.wokspaces import WorkspaceValidator

metadata = {
    "name": "workspaces",
    "description": "Endpoint for workspaces resources.",
}

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.get(
    "",
    name="workspaces.list",
    summary="Get workspaces by owner",
    response_model=List[WorkspaceSerializer]
)
def get_workspaces_by_owner(owner_id: int = Query(None, description="the owner id (int)")) -> List[WorkspaceSerializer]:
    workspaces = workspaces_services.get_workspaces(owner_id=owner_id)

    if not workspaces:
        raise ex.NotFoundError()

    return WorkspaceSerializer.from_queryset(workspaces)


@router.post(
    "",
    name="workspace.post",
    summary="Post workspace",
    response_model=WorkspaceSerializer,
)
def create_workspace(form: WorkspaceValidator) -> WorkspaceSerializer:
    workspace = workspaces_services.create_workspace(form.name, form.color)
    if not workspace:
        raise ex.HTTPException(status_code=400, detail="error")

    return WorkspaceSerializer.from_orm(workspace)


@router.get(
    "/{workspace_id}",
    name="workspaces.get",
    summary="Get workspace details",
    response_model=WorkspaceSerializer,
)
def get_workspace(workspace_id: int = Query(None, description="the workspace id (int)")) -> WorkspaceSerializer:
    """
    Get workspace detail by id.
    """
    workspace = workspaces_services.get_workspace(workspace_id)

    if workspace is None:
        raise ex.NotFoundError()

    return WorkspaceSerializer.from_orm(workspace)
