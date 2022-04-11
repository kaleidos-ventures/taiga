# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import Query
from fastapi.params import Depends
from taiga.base.api import Request
from taiga.base.api.permissions import check_permissions
from taiga.exceptions import api as ex
from taiga.exceptions import services as services_ex
from taiga.exceptions.api.errors import ERROR_400, ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import CanViewProject, HasPerm, IsProjectAdmin
from taiga.projects import services as projects_services
from taiga.projects.models import Project
from taiga.projects.serializers import ProjectSerializer, ProjectSummarySerializer
from taiga.projects.validators import PermissionsValidator, ProjectValidator
from taiga.routers import routes
from taiga.workspaces.api import get_workspace_or_404

# PERMISSIONS
LIST_WORKSPACE_PROJECTS = HasPerm("view_workspace")
CREATE_PROJECT = HasPerm("view_workspace")
GET_PROJECT = CanViewProject()
GET_PROJECT_PUBLIC_PERMISSIONS = IsProjectAdmin()
GET_PROJECT_WORKSPACE_MEMBER_PERMISSIONS = IsProjectAdmin()
UPDATE_PROJECT_PUBLIC_PERMISSIONS = IsProjectAdmin()
UPDATE_PROJECT_WORKSPACE_MEMBER_PERMISSIONS = IsProjectAdmin()


@routes.workspaces_projects.get(
    "",
    name="workspace.projects.list",
    summary="List workspace projects",
    response_model=list[ProjectSummarySerializer],
    responses=ERROR_422 | ERROR_403,
)
async def list_workspace_projects(
    request: Request, workspace_slug: str = Query("", description="the workspace slug (str)")
) -> list[Project]:
    """
    List projects of a workspace visible by the user.
    """
    workspace = await get_workspace_or_404(slug=workspace_slug)

    await check_permissions(permissions=LIST_WORKSPACE_PROJECTS, user=request.user, obj=workspace)

    return await projects_services.get_workspace_projects_for_user(workspace=workspace, user=request.user)


@routes.projects.post(
    "",
    name="projects.create",
    summary="Create project",
    response_model=ProjectSerializer,
    responses=ERROR_422 | ERROR_403,
)
async def create_project(
    request: Request,
    form: ProjectValidator = Depends(ProjectValidator.as_form),  # type: ignore[assignment, attr-defined]
) -> Project:
    """
    Create project for the logged user in a given workspace.
    """
    workspace = await get_workspace_or_404(slug=form.workspace_slug)
    await check_permissions(permissions=CREATE_PROJECT, user=request.user, obj=workspace)
    project = await projects_services.create_project(
        workspace=workspace,
        name=form.name,
        description=form.description,
        color=form.color,
        owner=request.user,
        logo=form.logo,
    )
    return await projects_services.get_project_detail(project=project, user=request.user)


@routes.projects.get(
    "/{slug}",
    name="projects.get",
    summary="Get project",
    response_model=ProjectSerializer,
    responses=ERROR_404 | ERROR_422 | ERROR_403,
)
async def get_project(request: Request, slug: str = Query("", description="the project slug (str)")) -> Project:
    """
    Get project detail by slug.
    """

    project = await get_project_or_404(slug)
    await check_permissions(permissions=GET_PROJECT, user=request.user, obj=project)
    return await projects_services.get_project_detail(project=project, user=request.user)


@routes.projects.get(
    "/{slug}/public-permissions",
    name="project.public-permissions.get",
    summary="Get project public permissions",
    response_model=list[str],
    responses=ERROR_404 | ERROR_422 | ERROR_403,
)
async def get_project_public_permissions(
    request: Request, slug: str = Query(None, description="the project slug (str)")
) -> list[str]:
    """
    Get project public permissions
    """

    project = await get_project_or_404(slug)
    await check_permissions(permissions=GET_PROJECT_PUBLIC_PERMISSIONS, user=request.user, obj=project)
    return project.public_permissions


@routes.projects.put(
    "/{slug}/public-permissions",
    name="project.public-permissions.put",
    summary="Edit project public permissions",
    response_model=list[str],
    responses=ERROR_400 | ERROR_404 | ERROR_422 | ERROR_403,
)
async def update_project_public_permissions(
    request: Request, form: PermissionsValidator, slug: str = Query(None, description="the project slug (str)")
) -> list[str]:
    """
    Edit project public permissions
    """

    project = await get_project_or_404(slug)
    await check_permissions(permissions=UPDATE_PROJECT_PUBLIC_PERMISSIONS, user=request.user, obj=project)

    try:
        return await projects_services.update_project_public_permissions(project, form.permissions)
    except services_ex.NotValidPermissionsSetError:
        raise ex.BadRequest("One or more permissions are not valid. Maybe, there is a typo.")
    except services_ex.IncompatiblePermissionsSetError:
        raise ex.BadRequest("Given permissions are incompatible")


@routes.projects.get(
    "/{slug}/workspace-member-permissions",
    name="project.workspace-member-permissions.get",
    summary="Get project workspace member permissions",
    response_model=list[str],
    responses=ERROR_400 | ERROR_404 | ERROR_422 | ERROR_403,
)
async def get_project_workspace_member_permissions(
    request: Request, slug: str = Query(None, description="the project slug (str)")
) -> list[str]:
    """
    Get project workspace member permissions
    """

    project = await get_project_or_404(slug)
    await check_permissions(permissions=GET_PROJECT_WORKSPACE_MEMBER_PERMISSIONS, user=request.user, obj=project)
    try:
        return await projects_services.get_workspace_member_permissions(project=project)
    except services_ex.NotPremiumWorkspaceError:
        raise ex.BadRequest("The workspace is not a premium one, so these perms cannot be seen")


@routes.projects.put(
    "/{slug}/workspace-member-permissions",
    name="project.workspace-member-permissions.put",
    summary="Edit project workspace memeber permissions",
    response_model=list[str],
    responses=ERROR_400 | ERROR_404 | ERROR_422 | ERROR_403,
)
async def update_project_workspace_member_permissions(
    request: Request, form: PermissionsValidator, slug: str = Query(None, description="the project slug (str)")
) -> list[str]:
    """
    Edit project workspace member permissions
    """

    project = await get_project_or_404(slug)
    await check_permissions(permissions=UPDATE_PROJECT_WORKSPACE_MEMBER_PERMISSIONS, user=request.user, obj=project)

    try:
        return await projects_services.update_project_workspace_member_permissions(project, form.permissions)
    except services_ex.NotValidPermissionsSetError:
        raise ex.BadRequest("One or more permissions are not valid. Maybe, there is a typo.")
    except services_ex.IncompatiblePermissionsSetError:
        raise ex.BadRequest("Given permissions are incompatible")
    except services_ex.NotPremiumWorkspaceError:
        raise ex.BadRequest("The workspace is not a premium one, so these perms cannot be set")


async def get_project_or_404(slug: str) -> Project:
    project = await projects_services.get_project(slug=slug)
    if project is None:
        raise ex.NotFoundError(f"Project {slug} does not exist")

    return project
