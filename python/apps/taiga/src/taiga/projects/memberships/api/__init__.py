# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from uuid import UUID

from fastapi import Response, status
from taiga.base.api import AuthRequest
from taiga.base.api.permissions import check_permissions
from taiga.base.validators import B64UUID
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_400, ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import CanViewProject, IsProjectAdmin, IsRelatedToTheUser
from taiga.projects.memberships import services as memberships_services
from taiga.projects.memberships.api.validators import ProjectMembershipValidator
from taiga.projects.memberships.models import ProjectMembership
from taiga.projects.memberships.serializers import ProjectMembershipSerializer
from taiga.projects.projects.api import get_project_or_404
from taiga.routers import routes

# PERMISSIONS
LIST_PROJECT_MEMBERSHIPS = CanViewProject()
UPDATE_PROJECT_MEMBERSHIP = IsProjectAdmin()
DELETE_PROJECT_MEMBERSHIP = IsProjectAdmin() | IsRelatedToTheUser("user")


##########################################################
# list project memberships
##########################################################


@routes.projects_memberships.get(
    "/projects/{id}/memberships",
    name="project.memberships.list",
    summary="List project memberships",
    response_model=list[ProjectMembershipSerializer],
    responses=ERROR_404 | ERROR_422,
)
async def list_project_memberships(
    id: B64UUID,
    request: AuthRequest,
    response: Response,
) -> list[ProjectMembership]:
    """
    List project memberships
    """

    project = await get_project_or_404(id)
    await check_permissions(permissions=LIST_PROJECT_MEMBERSHIPS, user=request.user, obj=project)
    return await memberships_services.list_project_memberships(project=project)


##########################################################
# update project membership
##########################################################


@routes.projects_memberships.patch(
    "/projects/{id}/memberships/{username}",
    name="project.memberships.update",
    summary="Update project membership",
    response_model=ProjectMembershipSerializer,
    responses=ERROR_422 | ERROR_400 | ERROR_404 | ERROR_403,
)
async def update_project_membership(
    id: B64UUID,
    username: str,
    request: AuthRequest,
    form: ProjectMembershipValidator,
) -> ProjectMembership:
    """
    Update project membership
    """
    membership = await get_project_membership_or_404(project_id=id, username=username)

    await check_permissions(permissions=UPDATE_PROJECT_MEMBERSHIP, user=request.user, obj=membership)

    return await memberships_services.update_project_membership(membership=membership, role_slug=form.role_slug)


##########################################################
# delete project membership
##########################################################


@routes.projects_memberships.delete(
    "/projects/{id}/memberships/{username}",
    name="project.memberships.delete",
    summary="Delete project membership",
    responses=ERROR_400 | ERROR_403 | ERROR_404 | ERROR_422,
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_project_membership(id: B64UUID, username: str, request: AuthRequest) -> None:
    """
    Delete a project membership
    """
    membership = await get_project_membership_or_404(project_id=id, username=username)

    await check_permissions(permissions=DELETE_PROJECT_MEMBERSHIP, user=request.user, obj=membership)

    await memberships_services.delete_project_membership(membership=membership)


################################################
# misc
################################################


async def get_project_membership_or_404(project_id: UUID, username: str) -> ProjectMembership:
    membership = await memberships_services.get_project_membership(project_id=project_id, username=username)
    if not membership:
        raise ex.NotFoundError("Membership not found")

    return membership
