# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from fastapi import Response
from taiga.base.api import AuthRequest, responses
from taiga.base.api.permissions import check_permissions
from taiga.base.validators import B64UUID
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_400, ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import IsWorkspaceMember
from taiga.routers import routes
from taiga.workspaces.invitations import services as workspaces_invitations_services
from taiga.workspaces.invitations.api.validators import WorkspaceInvitationsValidator
from taiga.workspaces.invitations.models import WorkspaceInvitation
from taiga.workspaces.invitations.permissions import IsWorkspaceInvitationRecipient
from taiga.workspaces.invitations.serializers import (
    CreateWorkspaceInvitationsSerializer,
    PublicWorkspaceInvitationSerializer,
    WorkspaceInvitationSerializer,
)
from taiga.workspaces.workspaces.api import get_workspace_or_404

# PERMISSIONS
ACCEPT_WORKSPACE_INVITATION_BY_TOKEN = IsWorkspaceInvitationRecipient()
CREATE_WORKSPACE_INVITATIONS = IsWorkspaceMember()
LIST_WORKSPACE_INVITATIONS = IsWorkspaceMember()


# HTTP 200 RESPONSES
CREATE_WORKSPACE_INVITATIONS_200 = responses.http_status_200(model=CreateWorkspaceInvitationsSerializer)
PUBLIC_WORKSPACE_INVITATION_200 = responses.http_status_200(model=PublicWorkspaceInvitationSerializer)


##########################################################
# create workspace invitations
##########################################################


@routes.workspaces_invitations.post(
    "/workspaces/{id}/invitations",
    name="workspace.invitations.create",
    summary="Create workspace invitations",
    responses=CREATE_WORKSPACE_INVITATIONS_200 | ERROR_400 | ERROR_403 | ERROR_404 | ERROR_422,
)
async def create_workspace_invitations(
    id: B64UUID,
    request: AuthRequest,
    form: WorkspaceInvitationsValidator,
) -> CreateWorkspaceInvitationsSerializer:
    """
    Create invitations to a workspace for a list of users (identified either by their username or their email).
    """
    workspace = await get_workspace_or_404(id=id)
    await check_permissions(permissions=CREATE_WORKSPACE_INVITATIONS, user=request.user, obj=workspace)

    return await workspaces_invitations_services.create_workspace_invitations(
        workspace=workspace, invitations=form.get_invitations_dict(), invited_by=request.user
    )


##########################################################
# list workspace invitations
##########################################################


@routes.workspaces_invitations.get(
    "/workspaces/{id}/invitations",
    name="workspace.invitations.list",
    summary="List workspace pending invitations",
    response_model=list[WorkspaceInvitationSerializer],
    responses=ERROR_403 | ERROR_404 | ERROR_422,
)
async def list_workspace_invitations(
    id: B64UUID,
    request: AuthRequest,
    response: Response,
) -> list[WorkspaceInvitation]:
    """
    List (pending) workspace invitations
    """
    workspace = await get_workspace_or_404(id)
    await check_permissions(permissions=LIST_WORKSPACE_INVITATIONS, user=request.user, obj=workspace)

    return await workspaces_invitations_services.list_pending_workspace_invitations(workspace=workspace)


##########################################################
# get workspace invitation
##########################################################


@routes.unauth_workspaces_invitations.get(
    "/workspaces/invitations/{token}",
    name="workspace.invitations.get",
    summary="Get public information about a workspace invitation",
    responses=PUBLIC_WORKSPACE_INVITATION_200 | ERROR_400 | ERROR_404 | ERROR_422,
    response_model=None,
)
async def get_public_workspace_invitation(token: str) -> PublicWorkspaceInvitationSerializer:
    """
    Get public information about a workspace invitation
    """
    invitation = await workspaces_invitations_services.get_public_workspace_invitation(token=token)
    if not invitation:
        raise ex.NotFoundError("Invitation not found")

    return invitation


##########################################################
# accept workspace invitation
##########################################################


@routes.workspaces_invitations.post(
    "/workspaces/invitations/{token}/accept",
    name="workspace.invitations.accept",
    summary="Accept a workspace invitation using a token",
    response_model=WorkspaceInvitationSerializer,
    responses=ERROR_400 | ERROR_404 | ERROR_403,
)
async def accept_workspace_invitation_by_token(token: str, request: AuthRequest) -> WorkspaceInvitation:
    """
    A user accepts a workspace invitation using an invitation token
    """
    invitation = await get_workspace_invitation_by_token_or_404(token=token)
    await check_permissions(permissions=ACCEPT_WORKSPACE_INVITATION_BY_TOKEN, user=request.user, obj=invitation)
    return await workspaces_invitations_services.accept_workspace_invitation(invitation=invitation)


##########################################################
# misc
##########################################################


async def get_workspace_invitation_by_token_or_404(token: str) -> WorkspaceInvitation:
    invitation = await workspaces_invitations_services.get_workspace_invitation(token=token)
    if not invitation:
        raise ex.NotFoundError("Invitation does not exist")

    return invitation
