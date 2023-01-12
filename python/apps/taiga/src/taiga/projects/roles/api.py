# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import Query
from taiga.base.api import AuthRequest
from taiga.base.api.permissions import check_permissions
from taiga.base.validators import B64UUID
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_400, ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import IsProjectAdmin
from taiga.projects.projects.api import get_project_or_404
from taiga.projects.projects.api.validators import PermissionsValidator
from taiga.projects.projects.models import Project
from taiga.projects.roles import services as roles_services
from taiga.projects.roles.models import ProjectRole
from taiga.projects.roles.serializers import ProjectRoleSerializer
from taiga.projects.roles.services import exceptions as services_ex
from taiga.routers import routes

# PERMISSIONS
GET_PROJECT_ROLES = IsProjectAdmin()
UPDATE_PROJECT_ROLE_PERMISSIONS = IsProjectAdmin()


@routes.projects.get(
    "/{id}/roles",
    name="project.permissions.get",
    summary="Get project roles permissions",
    response_model=list[ProjectRoleSerializer],
    responses=ERROR_404 | ERROR_422 | ERROR_403,
)
async def get_project_roles(
    request: AuthRequest, id: B64UUID = Query(None, description="the project id (B64UUID)")
) -> list[ProjectRole]:
    """
    Get project roles and permissions
    """

    project = await get_project_or_404(id)
    await check_permissions(permissions=GET_PROJECT_ROLES, user=request.user, obj=project)
    return await roles_services.get_project_roles(project=project)


@routes.projects.put(
    "/{id}/roles/{role_slug}/permissions",
    name="project.permissions.put",
    summary="Edit project roles permissions",
    response_model=ProjectRoleSerializer,
    responses=ERROR_400 | ERROR_404 | ERROR_422 | ERROR_403,
)
async def update_project_role_permissions(
    request: AuthRequest,
    form: PermissionsValidator,
    id: B64UUID = Query(None, description="the project id (B64UUID)"),
    role_slug: str = Query(None, description="the role slug (str)"),
) -> ProjectRole:
    """
    Edit project roles permissions
    """

    project = await get_project_or_404(id)
    await check_permissions(permissions=UPDATE_PROJECT_ROLE_PERMISSIONS, user=request.user, obj=project)
    role = await get_project_role_or_404(project=project, slug=role_slug)

    try:
        await roles_services.update_project_role_permissions(role, form.permissions)
    except services_ex.NonEditableRoleError as exc:
        raise ex.ForbiddenError(str(exc))

    return await get_project_role_or_404(project=project, slug=role_slug)


async def get_project_role_or_404(project: Project, slug: str) -> ProjectRole:
    role = await roles_services.get_project_role(project=project, slug=slug)
    if role is None:
        raise ex.NotFoundError(f"Role {slug} does not exist")

    return role
