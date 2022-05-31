# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import Query
from taiga.base.api import Request
from taiga.base.api.permissions import check_permissions
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_400, ERROR_403, ERROR_404, ERROR_422
from taiga.invitations import services as invitations_services
from taiga.invitations.dataclasses import PublicInvitation
from taiga.invitations.models import Invitation
from taiga.invitations.permissions import IsProjectInvitationRecipient
from taiga.invitations.serializers import CreateInvitationsSerializer, InvitationSerializer, PublicInvitationSerializer
from taiga.invitations.validators import InvitationsValidator
from taiga.permissions import IsAuthenticated, IsProjectAdmin
from taiga.projects.api import get_project_or_404
from taiga.routers import routes

# PERMISSIONS
ACCEPT_INVITATION = IsAuthenticated()
ACCEPT_TOKEN_INVITATION = IsProjectInvitationRecipient()
CREATE_INVITATIONS = IsProjectAdmin()


@routes.unauth_projects.get(
    "/invitations/{token}",
    name="project.invitations.get",
    summary="Get public information about a project invitation",
    response_model=PublicInvitationSerializer,
    responses=ERROR_400 | ERROR_404 | ERROR_422,
)
async def get_public_project_invitation(
    token: str = Query(None, description="the project invitation token (str)")
) -> PublicInvitation:
    """
    Get public information about a project invitation
    """
    invitation = await invitations_services.get_public_project_invitation(token=token)

    if not invitation:
        raise ex.NotFoundError("Invitation not found")

    return invitation


@routes.projects.get(
    "/{slug}/invitations",
    name="project.invitations.get",
    summary="Get project invitations",
    response_model=list[InvitationSerializer],
    responses=ERROR_404 | ERROR_422 | ERROR_403,
)
async def list_project_invitations(
    request: Request, slug: str = Query(None, description="the project slug (str)")
) -> list[Invitation]:
    """
    List (pending) project invitations
    If the user is a project admin: return all the pending project invitation list
    If the user is invited to the project: return a list with just her project invitation
    If the user is not invited to the project (including anonymous users): return an empty list
    """
    project = await get_project_or_404(slug)

    return await invitations_services.get_project_invitations(project=project, user=request.user)


@routes.projects.post(
    "/invitations/{token}/accept",
    name="project.invitations.accept",
    summary="Accept a project invitation",
    response_model=InvitationSerializer,
    responses=ERROR_400 | ERROR_404 | ERROR_403,
)
async def accept_invitation_by_token(
    request: Request, token: str = Query(None, description="the project invitation token (str)")
) -> Invitation:
    """
    A user accepts a project invitation using an invitation token
    """
    invitation = await invitations_services.get_project_invitation(token=token)

    if not invitation:
        raise ex.NotFoundError("Invitation not found")

    await check_permissions(permissions=ACCEPT_TOKEN_INVITATION, user=request.user, obj=invitation)

    return await invitations_services.accept_project_invitation(invitation=invitation, user=request.user)


@routes.projects.post(
    "/{slug}/invitations/accept",
    name="project.my.invitations.accept",
    summary="Accept my project invitation",
    response_model=InvitationSerializer,
    responses=ERROR_400 | ERROR_404 | ERROR_403,
)
async def accept_invitation_by_project(
    request: Request, slug: str = Query(None, description="the project slug (str)")
) -> Invitation:
    """
    An authenticated user accepts a project invitation
    """
    await check_permissions(permissions=ACCEPT_INVITATION, user=request.user, obj=None)

    invitation = await invitations_services.get_project_invitation_by_user(project_slug=slug, user=request.user)

    if not invitation:
        raise ex.NotFoundError("Invitation not found")

    return await invitations_services.accept_project_invitation(invitation=invitation, user=request.user)


@routes.projects.post(
    "/{slug}/invitations",
    name="project.invitations.create",
    summary="Create project invitations",
    response_model=list[CreateInvitationsSerializer],
    responses=ERROR_400 | ERROR_404 | ERROR_422 | ERROR_403,
)
async def create_invitations(
    request: Request, form: InvitationsValidator, slug: str = Query(None, description="the project slug (str)")
) -> list[Invitation]:
    """
    Create invitations to a project for a list of users (identified either by their username or their email, and the
    role they'll take in the project). In case of receiving several invitations for the same user, just the first
    role will be considered.
    """
    project = await get_project_or_404(slug=slug)
    await check_permissions(permissions=CREATE_INVITATIONS, user=request.user, obj=project)

    return await invitations_services.create_invitations(
        project=project, invitations=form.get_invitations_dict(), invited_by=request.user
    )
