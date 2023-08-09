# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from uuid import UUID

from taiga.base.api import AuthRequest
from taiga.base.api.permissions import check_permissions
from taiga.base.validators import B64UUID
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_400, ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import IsProjectAdmin
from taiga.projects.projects.api import get_project_or_404
from taiga.projects.projects.api.validators import PermissionsValidator
from taiga.projects.roles import services as roles_services
from taiga.projects.roles.models import ProjectRole
from taiga.projects.roles.serializers import ProjectRoleSerializer
from taiga.projects.roles.services import exceptions as services_ex
from taiga.routers import routes

# PERMISSIONS
LIST_PROJECT_ROLES = IsProjectAdmin()
UPDATE_PROJECT_ROLE_PERMISSIONS = IsProjectAdmin()


##########################################################
# list roles
##########################################################


@routes.projects.get(
    "/projects/{project_id}/roles",
    name="project.roles.list",
    summary="Get project roles permissions",
    response_model=list[ProjectRoleSerializer],
    responses=ERROR_403 | ERROR_404 | ERROR_422,
)
async def list_project_roles(project_id: B64UUID, request: AuthRequest) -> list[ProjectRole]:
    """
    Get project roles and permissions
    """

    project = await get_project_or_404(project_id)
    await check_permissions(permissions=LIST_PROJECT_ROLES, user=request.user, obj=project)
    return await roles_services.list_project_roles(project=project)


##########################################################
# update project role permissions
##########################################################


@routes.projects.put(
    "/projects/{project_id}/roles/{role_slug}/permissions",
    name="project.roles.permissions.put",
    summary="Edit project roles permissions",
    response_model=ProjectRoleSerializer,
    responses=ERROR_400 | ERROR_403 | ERROR_404 | ERROR_422,
)
async def update_project_role_permissions(
    project_id: B64UUID,
    role_slug: str,
    request: AuthRequest,
    form: PermissionsValidator,
) -> ProjectRole:
    """
    Edit project roles permissions
    """

    role = await get_project_role_or_404(project_id=project_id, slug=role_slug)
    await check_permissions(permissions=UPDATE_PROJECT_ROLE_PERMISSIONS, user=request.user, obj=role)

    try:
        await roles_services.update_project_role_permissions(role, form.permissions)
    except services_ex.NonEditableRoleError as exc:
        # change the bad-request into a forbidden error
        raise ex.ForbiddenError(str(exc))

    return role


##########################################################
# misc
##########################################################


async def get_project_role_or_404(project_id: UUID, slug: str) -> ProjectRole:
    role = await roles_services.get_project_role(project_id=project_id, slug=slug)
    if role is None:
        raise ex.NotFoundError(f"Role {slug} does not exist")

    return role
