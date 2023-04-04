# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from fastapi import Depends, Query, Response
from taiga.base.api import AuthRequest
from taiga.base.api import pagination as api_pagination
from taiga.base.api import responses
from taiga.base.api.pagination import PaginationQuery
from taiga.base.api.permissions import check_permissions
from taiga.base.validators import B64UUID
from taiga.exceptions.api.errors import ERROR_404, ERROR_422
from taiga.permissions import IsWorkspaceAdmin
from taiga.routers import routes
from taiga.workspaces.memberships import services as memberships_services
from taiga.workspaces.memberships.serializers import (
    WorkspaceMembershipDetailSerializer,
    WorkspaceNonMemberDetailSerializer,
)
from taiga.workspaces.workspaces.api import get_workspace_or_404

# PERMISSIONS
LIST_WORKSPACE_MEMBERSHIPS = IsWorkspaceAdmin()
LIST_WORKSPACE_NON_MEMBERS = IsWorkspaceAdmin()

# HTTP 200 RESPONSES
LIST_WS_MEMBERSHIP_DETAIL_200 = responses.http_status_200(model=list[WorkspaceMembershipDetailSerializer])
LIST_WS_NON_MEMBERS_DETAIL_200 = responses.http_status_200(model=list[WorkspaceNonMemberDetailSerializer])


##########################################################
# list workspace memberships
##########################################################


@routes.workspaces.get(
    "/{id}/memberships",
    name="workspace.memberships.list",
    summary="List workspace memberships",
    responses=LIST_WS_MEMBERSHIP_DETAIL_200 | ERROR_404 | ERROR_422,
)
async def list_workspace_memberships(
    request: AuthRequest,
    response: Response,
    pagination_params: PaginationQuery = Depends(),
    id: B64UUID = Query(None, description="the workspace id (B64UUID)"),
) -> list[WorkspaceMembershipDetailSerializer]:
    """
    List workspace memberships
    """
    workspace = await get_workspace_or_404(id)
    await check_permissions(permissions=LIST_WORKSPACE_MEMBERSHIPS, user=request.user, obj=workspace)

    pagination, memberships = await memberships_services.list_paginated_workspace_memberships(
        workspace=workspace, offset=pagination_params.offset, limit=pagination_params.limit
    )
    api_pagination.set_pagination(response=response, pagination=pagination)

    return memberships


##########################################################
# list workspace non members
##########################################################


@routes.workspaces.get(
    "/{id}/non-members",
    name="workspace.non-members.list",
    summary="List workspace non members",
    responses=LIST_WS_NON_MEMBERS_DETAIL_200 | ERROR_404 | ERROR_422,
)
async def list_workspace_non_members(
    request: AuthRequest,
    response: Response,
    pagination_params: PaginationQuery = Depends(),
    id: B64UUID = Query(None, description="the workspace id (B64UUID)"),
) -> list[WorkspaceNonMemberDetailSerializer]:
    """
    List workspace non members
    """
    workspace = await get_workspace_or_404(id)
    await check_permissions(permissions=LIST_WORKSPACE_NON_MEMBERS, user=request.user, obj=workspace)

    pagination, non_members = await memberships_services.list_paginated_workspace_non_members(
        workspace=workspace, offset=pagination_params.offset, limit=pagination_params.limit
    )
    api_pagination.set_pagination(response=response, pagination=pagination)

    return non_members
