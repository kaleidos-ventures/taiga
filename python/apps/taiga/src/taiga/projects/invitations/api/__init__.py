# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from uuid import UUID

from fastapi import Response, status
from taiga.base.api import AuthRequest, responses
from taiga.base.api.permissions import check_permissions
from taiga.base.validators import B64UUID
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_400, ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import IsAuthenticated, IsProjectAdmin
from taiga.projects.invitations import services as invitations_services
from taiga.projects.invitations.api.validators import (
    ProjectInvitationsValidator,
    ResendProjectInvitationValidator,
    RevokeProjectInvitationValidator,
    UpdateProjectInvitationValidator,
)
from taiga.projects.invitations.models import ProjectInvitation
from taiga.projects.invitations.permissions import IsProjectInvitationRecipient
from taiga.projects.invitations.serializers import (
    CreateProjectInvitationsSerializer,
    ProjectInvitationSerializer,
    PublicProjectInvitationSerializer,
)
from taiga.projects.projects.api import get_project_or_404
from taiga.routers import routes

# PERMISSIONS
ACCEPT_PROJECT_INVITATION = IsAuthenticated()
ACCEPT_PROJECT_INVITATION_BY_TOKEN = IsProjectInvitationRecipient()
CREATE_PROJECT_INVITATIONS = IsProjectAdmin()
RESEND_PROJECT_INVITATION = IsProjectAdmin()
REVOKE_PROJECT_INVITATION = IsProjectAdmin()
UPDATE_PROJECT_INVITATION = IsProjectAdmin()


# HTTP 200 RESPONSES
CREATE_PROJECT_INVITATIONS_200 = responses.http_status_200(model=CreateProjectInvitationsSerializer)
PUBLIC_PROJECT_INVITATION_200 = responses.http_status_200(model=PublicProjectInvitationSerializer)


##########################################################
# create project invitations
##########################################################


@routes.projects_invitations.post(
    "/projects/{id}/invitations",
    name="project.invitations.create",
    summary="Create project invitations",
    responses=CREATE_PROJECT_INVITATIONS_200 | ERROR_400 | ERROR_403 | ERROR_404 | ERROR_422,
)
# TODO: remove "Query" from the "id" parameter
async def create_project_invitations(
    id: B64UUID,
    request: AuthRequest,
    form: ProjectInvitationsValidator,
) -> CreateProjectInvitationsSerializer:
    """
    Create invitations to a project for a list of users (identified either by their username or their email, and the
    role they'll take in the project). In case of receiving several invitations for the same user, just the first
    role will be considered.
    """
    project = await get_project_or_404(id=id)
    await check_permissions(permissions=CREATE_PROJECT_INVITATIONS, user=request.user, obj=project)

    return await invitations_services.create_project_invitations(
        project=project, invitations=form.get_invitations_dict(), invited_by=request.user
    )


##########################################################
# list project invitations
##########################################################


@routes.projects_invitations.get(
    "/projects/{id}/invitations",
    name="project.invitations.list",
    summary="List project pending invitations",
    response_model=list[ProjectInvitationSerializer],
    responses=ERROR_403 | ERROR_404 | ERROR_422,
)
async def list_project_invitations(
    id: B64UUID,
    request: AuthRequest,
    response: Response,
) -> list[ProjectInvitation]:
    """
    List (pending) project invitations
    If the user is a project admin: return the pending project invitation list
    If the user is invited to the project: return a list with just her project invitation
    If the user is not invited to the project (including anonymous users): return an empty list
    """
    project = await get_project_or_404(id)
    return await invitations_services.list_pending_project_invitations(project=project, user=request.user)


##########################################################
# get project invitation
##########################################################


@routes.unauth_projects_invitations.get(
    "/projects/invitations/{token}",
    name="project.invitations.get",
    summary="Get public information about a project invitation",
    responses=PUBLIC_PROJECT_INVITATION_200 | ERROR_400 | ERROR_404 | ERROR_422,
    response_model=None,
)
async def get_public_project_invitation(token: str) -> PublicProjectInvitationSerializer:
    """
    Get public information about a project invitation
    """
    invitation = await invitations_services.get_public_project_invitation(token=token)
    if not invitation:
        raise ex.NotFoundError("Invitation not found")

    return invitation


##########################################################
# update project invitation
##########################################################


@routes.projects_invitations.patch(
    "/projects/{project_id}/invitations/{id}",
    name="project.invitations.update",
    summary="Update project invitation",
    response_model=ProjectInvitationSerializer,
    responses=ERROR_400 | ERROR_403 | ERROR_404 | ERROR_422,
)
async def update_project_invitation(
    id: UUID,
    project_id: B64UUID,
    request: AuthRequest,
    form: UpdateProjectInvitationValidator,
) -> ProjectInvitation:
    """
    Update project invitation
    """
    invitation = await get_project_invitation_by_id_or_404(project_id=project_id, id=id)
    await check_permissions(permissions=UPDATE_PROJECT_INVITATION, user=request.user, obj=invitation)

    return await invitations_services.update_project_invitation(invitation=invitation, role_slug=form.role_slug)


##########################################################
# resend project invitation
##########################################################


@routes.projects_invitations.post(
    "/projects/{id}/invitations/resend",
    name="project.invitations.resend",
    summary="Resend project invitation",
    response_class=Response,
    responses=ERROR_400 | ERROR_403 | ERROR_404 | ERROR_422,
    status_code=status.HTTP_204_NO_CONTENT,
)
async def resend_project_invitation(
    id: B64UUID,
    request: AuthRequest,
    form: ResendProjectInvitationValidator,
) -> None:
    """
    Resend invitation to a project
    """
    invitation = await get_project_invitation_by_username_or_email_or_404(
        project_id=id, username_or_email=form.username_or_email
    )
    await check_permissions(permissions=RESEND_PROJECT_INVITATION, user=request.user, obj=invitation)
    await invitations_services.resend_project_invitation(invitation=invitation, resent_by=request.user)


##########################################################
# revoke project invitation
##########################################################


@routes.projects_invitations.post(
    "/projects/{id}/invitations/revoke",
    name="project.invitations.revoke",
    summary="Revoke project invitation",
    responses=ERROR_400 | ERROR_403 | ERROR_404 | ERROR_422,
    response_class=Response,
    status_code=status.HTTP_204_NO_CONTENT,
)
async def revoke_project_invitation(
    id: B64UUID,
    request: AuthRequest,
    form: RevokeProjectInvitationValidator,
) -> None:
    """
    Revoke invitation in a project.
    """
    invitation = await get_project_invitation_by_username_or_email_or_404(
        project_id=id, username_or_email=form.username_or_email
    )
    await check_permissions(permissions=REVOKE_PROJECT_INVITATION, user=request.user, obj=invitation)
    await invitations_services.revoke_project_invitation(invitation=invitation, revoked_by=request.user)


##########################################################
# accept project invitation
##########################################################


@routes.projects_invitations.post(
    "/projects/invitations/{token}/accept",
    name="project.invitations.accept",
    summary="Accept a project invitation using a token",
    response_model=ProjectInvitationSerializer,
    responses=ERROR_400 | ERROR_403 | ERROR_404 | ERROR_422,
)
async def accept_project_invitation_by_token(request: AuthRequest, token: str) -> ProjectInvitation:
    """
    A user accepts a project invitation using an invitation token
    """
    invitation = await get_project_invitation_by_token_or_404(token=token)
    await check_permissions(permissions=ACCEPT_PROJECT_INVITATION_BY_TOKEN, user=request.user, obj=invitation)
    return await invitations_services.accept_project_invitation(invitation=invitation)


@routes.projects_invitations.post(
    "/projects/{id}/invitations/accept",
    name="project.my.invitations.accept",
    summary="Accept a project invitation for authenticated users",
    response_model=ProjectInvitationSerializer,
    responses=ERROR_400 | ERROR_403 | ERROR_404 | ERROR_422,
)
async def accept_project_invitation_by_project(id: B64UUID, request: AuthRequest) -> ProjectInvitation:
    """
    An authenticated user accepts a project invitation
    """
    await check_permissions(permissions=ACCEPT_PROJECT_INVITATION, user=request.user, obj=None)
    invitation = await get_project_invitation_by_username_or_email_or_404(
        project_id=id, username_or_email=request.user.username
    )
    return await invitations_services.accept_project_invitation(invitation=invitation)


##########################################################
# misc
##########################################################


async def get_project_invitation_by_username_or_email_or_404(
    project_id: UUID, username_or_email: str
) -> ProjectInvitation:
    invitation = await invitations_services.get_project_invitation_by_username_or_email(
        project_id=project_id, username_or_email=username_or_email
    )
    if not invitation:
        raise ex.NotFoundError("Invitation does not exist")

    return invitation


async def get_project_invitation_by_id_or_404(project_id: UUID, id: UUID) -> ProjectInvitation:
    invitation = await invitations_services.get_project_invitation_by_id(project_id=project_id, id=id)
    if not invitation:
        raise ex.NotFoundError("Invitation does not exist")

    return invitation


async def get_project_invitation_by_token_or_404(token: str) -> ProjectInvitation:
    invitation = await invitations_services.get_project_invitation(token=token)
    if not invitation:
        raise ex.NotFoundError("Invitation does not exist")

    return invitation
