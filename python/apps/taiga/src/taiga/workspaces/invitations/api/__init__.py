# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from fastapi import Query
from taiga.base.api import AuthRequest, responses
from taiga.base.api.permissions import check_permissions
from taiga.base.validators import B64UUID
from taiga.exceptions.api.errors import ERROR_400, ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import IsWorkspaceAdmin
from taiga.routers import routes
from taiga.workspaces.invitations import services as workspaces_invitations_services
from taiga.workspaces.invitations.api.validators import WorkspaceInvitationsValidator
from taiga.workspaces.invitations.serializers import CreateWorkspaceInvitationsSerializer
from taiga.workspaces.workspaces.api import get_workspace_or_404

# PERMISSIONS
CREATE_WORKSPACE_INVITATIONS = IsWorkspaceAdmin()


# HTTP 200 RESPONSES
CREATE_WORKSPACE_INVITATIONS_200 = responses.http_status_200(model=CreateWorkspaceInvitationsSerializer)


##########################################################
# create workspace invitations
##########################################################


@routes.workspaces_invitations.post(
    "/workspaces/{id}/invitations",
    name="workspace.invitations.create",
    summary="Create workspace invitations",
    responses=CREATE_WORKSPACE_INVITATIONS_200 | ERROR_400 | ERROR_404 | ERROR_422 | ERROR_403,
)
async def create_workspace_invitations(
    request: AuthRequest,
    form: WorkspaceInvitationsValidator,
    id: B64UUID = Query(None, description="the workspace id (B64UUID)"),
) -> CreateWorkspaceInvitationsSerializer:
    """
    Create invitations to a workspace for a list of users (identified either by their username or their email).
    """
    workspace = await get_workspace_or_404(id=id)
    await check_permissions(permissions=CREATE_WORKSPACE_INVITATIONS, user=request.user, obj=workspace)

    return await workspaces_invitations_services.create_workspace_invitations(
        workspace=workspace, invitations=form.get_invitations_dict(), invited_by=request.user
    )
