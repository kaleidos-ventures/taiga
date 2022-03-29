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
from taiga.invitations import services
from taiga.invitations.models import Invitation
from taiga.invitations.serializers import InvitationSerializer
from taiga.invitations.validators import InvitationsValidator
from taiga.permissions import IsProjectAdmin
from taiga.projects.api import get_project_or_404
from taiga.roles import exceptions as roles_ex
from taiga.routers import routes

# PERMISSIONS
CREATE_INVITATIONS = IsProjectAdmin()


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
        return await services.create_invitations(
            project=project, invitations=form.get_invitations_dict(), invited_by=request.user
        )
    except roles_ex.NonExistingRoleError:
        raise ex.BadRequest("The role_slug does not exist")
