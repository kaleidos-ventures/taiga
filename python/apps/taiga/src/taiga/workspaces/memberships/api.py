# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC
from uuid import UUID

from fastapi import Depends, Response, status
from taiga.base.api import AuthRequest
from taiga.base.api import pagination as api_pagination
from taiga.base.api import responses
from taiga.base.api.pagination import PaginationQuery
from taiga.base.api.permissions import check_permissions
from taiga.base.validators import B64UUID
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import IsWorkspaceMember
from taiga.routers import routes
from taiga.workspaces.memberships import services as memberships_services
from taiga.workspaces.memberships.models import WorkspaceMembership
from taiga.workspaces.memberships.serializers import WorkspaceGuestDetailSerializer, WorkspaceMembershipDetailSerializer
from taiga.workspaces.workspaces.api import get_workspace_or_404

# PERMISSIONS
LIST_WORKSPACE_MEMBERSHIPS = IsWorkspaceMember()
LIST_WORKSPACE_GUESTS = IsWorkspaceMember()
DELETE_WORKSPACE_MEMBERSHIP = IsWorkspaceMember()

# HTTP 200 RESPONSES
LIST_WS_MEMBERSHIP_DETAIL_200 = responses.http_status_200(model=list[WorkspaceMembershipDetailSerializer])
LIST_WS_GUESTS_DETAIL_200 = responses.http_status_200(model=list[WorkspaceGuestDetailSerializer])


##########################################################
# list workspace memberships
##########################################################


@routes.workspaces_memberships.get(
    "/workspaces/{id}/memberships",
    name="workspace.memberships.list",
    summary="List workspace memberships",
    responses=LIST_WS_MEMBERSHIP_DETAIL_200 | ERROR_404 | ERROR_422,
    response_model=None,
)
async def list_workspace_memberships(
    id: B64UUID,
    request: AuthRequest,
    response: Response,
    pagination_params: PaginationQuery = Depends(),
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
# list workspace guests
##########################################################


@routes.workspaces_memberships.get(
    "/workspaces/{id}/guests",
    name="workspace.guests.list",
    summary="List workspace guests",
    responses=LIST_WS_GUESTS_DETAIL_200 | ERROR_404 | ERROR_422,
    response_model=None,
)
async def list_workspace_guests(
    id: B64UUID,
    request: AuthRequest,
    response: Response,
    pagination_params: PaginationQuery = Depends(),
) -> list[WorkspaceGuestDetailSerializer]:
    """
    List workspace guests
    """
    workspace = await get_workspace_or_404(id)
    await check_permissions(permissions=LIST_WORKSPACE_GUESTS, user=request.user, obj=workspace)

    pagination, guests = await memberships_services.list_paginated_workspace_guests(
        workspace=workspace, offset=pagination_params.offset, limit=pagination_params.limit
    )
    api_pagination.set_pagination(response=response, pagination=pagination)

    return guests


##########################################################
# delete workspace membership
##########################################################


@routes.workspaces_memberships.delete(
    "/workspaces/{id}/memberships/{username}",
    name="workspace.membership.delete",
    summary="Delete workspace membership",
    responses=ERROR_404 | ERROR_403,
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_workspace_membership(
    id: B64UUID,
    username: str,
    request: AuthRequest,
) -> None:
    """
    Delete a workspace membership
    """
    membership = await get_workspace_membership_or_404(workspace_id=id, username=username)
    await check_permissions(permissions=DELETE_WORKSPACE_MEMBERSHIP, user=request.user, obj=membership.workspace)

    await memberships_services.delete_workspace_membership(membership=membership)


################################################
# misc: get workspace membership or 404
################################################


async def get_workspace_membership_or_404(workspace_id: UUID, username: str) -> WorkspaceMembership:
    membership = await memberships_services.get_workspace_membership(workspace_id=workspace_id, username=username)
    if membership is None:
        raise ex.NotFoundError(f"User {username} is not a member of workspace {workspace_id}")

    return membership
