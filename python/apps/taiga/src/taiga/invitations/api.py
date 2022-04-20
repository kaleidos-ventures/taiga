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
from taiga.invitations.models import Invitation
from taiga.invitations.serializers import InvitationSerializer
from taiga.invitations.validators import InvitationsValidator
from taiga.permissions import IsProjectAdmin
from taiga.projects.api import get_project_or_404
from taiga.roles import exceptions as roles_ex
from taiga.routers import routes

# PERMISSIONS
CREATE_INVITATIONS = IsProjectAdmin()
GET_PROJECT_INVITATIONS = IsProjectAdmin()


@routes.projects.post(
    "/{slug}/invitations",
    name="project.invitations.create",
    summary="Create invitations",
    response_model=list[InvitationSerializer],
    responses=ERROR_400 | ERROR_404 | ERROR_422 | ERROR_403,
)
async def create_invitations(
    request: Request, form: InvitationsValidator, slug: str = Query(None, description="the project slug (str)")
) -> list[Invitation]:
    """
    Create invitations for a project
    """
    project = await get_project_or_404(slug=slug)
    await check_permissions(permissions=CREATE_INVITATIONS, user=request.user, obj=project)

    try:
        return await invitations_services.create_invitations(
            project=project, invitations=form.get_invitations_dict(), invited_by=request.user
        )
    except roles_ex.NonExistingRoleError:
        raise ex.BadRequest("The role_slug does not exist")


@routes.projects.get(
    "/{slug}/invitations",
    name="project.invitations.get",
    summary="Get project invitations",
    response_model=list[InvitationSerializer],
    responses=ERROR_404 | ERROR_422 | ERROR_403,
)
async def get_project_invitations(
    request: Request, slug: str = Query(None, description="the project slug (str)")
) -> list[Invitation]:
    """
    Get project invitations
    """
    project = await get_project_or_404(slug)
    await check_permissions(permissions=GET_PROJECT_INVITATIONS, user=request.user, obj=project)

    return await invitations_services.get_project_invitations(project=project)
