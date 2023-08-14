# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from uuid import UUID

from fastapi import status
from fastapi.params import Depends
from taiga.base.api import AuthRequest, responses
from taiga.base.api.permissions import check_permissions
from taiga.base.validators import B64UUID
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_400, ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import CanViewProject, HasPerm, IsAuthenticated, IsProjectAdmin, IsWorkspaceMember
from taiga.permissions import services as permissions_services
from taiga.projects.projects import services as projects_services
from taiga.projects.projects.api.validators import PermissionsValidator, ProjectValidator, UpdateProjectValidator
from taiga.projects.projects.models import Project
from taiga.projects.projects.serializers import ProjectDetailSerializer, ProjectSummarySerializer
from taiga.routers import routes
from taiga.workspaces.workspaces import services as workspaces_services
from taiga.workspaces.workspaces.api import get_workspace_or_404

# PERMISSIONS
CREATE_PROJECT = HasPerm("view_workspace")
LIST_WORKSPACE_PROJECTS = IsAuthenticated()  # HasPerm("view_workspace")
LIST_WORKSPACE_INVITED_PROJECTS = IsAuthenticated()  # HasPerm("view_workspace")
GET_PROJECT = CanViewProject()
UPDATE_PROJECT = IsProjectAdmin()
GET_PROJECT_PUBLIC_PERMISSIONS = IsProjectAdmin()
UPDATE_PROJECT_PUBLIC_PERMISSIONS = IsProjectAdmin()
DELETE_PROJECT = IsProjectAdmin() | IsWorkspaceMember()

# HTTP 200 RESPONSES
PROJECT_DETAIL_200 = responses.http_status_200(model=ProjectDetailSerializer)


##########################################################
# create project
##########################################################


@routes.projects.post(
    "/projects",
    name="projects.create",
    summary="Create project",
    responses=PROJECT_DETAIL_200 | ERROR_400 | ERROR_404 | ERROR_422 | ERROR_403,
    response_model=None,
)
async def create_project(
    request: AuthRequest,
    form: ProjectValidator = Depends(ProjectValidator.as_form),  # type: ignore[assignment, attr-defined]
) -> ProjectDetailSerializer:
    """
    Create project in a given workspace.
    """
    workspace = await workspaces_services.get_workspace(id=form.workspace_id)
    if workspace is None:
        raise ex.BadRequest(f"Workspace {form.workspace_id} does not exist")

    await check_permissions(permissions=CREATE_PROJECT, user=request.user, obj=workspace)
    return await projects_services.create_project(
        workspace=workspace,
        name=form.name,
        description=form.description,
        color=form.color,
        created_by=request.user,
        logo=form.logo,
    )


##########################################################
# list projects
##########################################################


@routes.projects.get(
    "/workspaces/{workspace_id}/projects",
    name="workspace.projects.list",
    summary="List workspace projects",
    response_model=list[ProjectSummarySerializer],
    responses=ERROR_403 | ERROR_404 | ERROR_422,
)
async def list_workspace_projects(workspace_id: B64UUID, request: AuthRequest) -> list[Project]:
    """
    List projects of a workspace visible by the user.
    """
    workspace = await get_workspace_or_404(id=workspace_id)
    await check_permissions(permissions=LIST_WORKSPACE_PROJECTS, user=request.user, obj=workspace)
    return await projects_services.list_workspace_projects_for_user(workspace=workspace, user=request.user)


@routes.projects.get(
    "/workspaces/{workspace_id}/invited-projects",
    name="workspace.invited-projects.list",
    summary="List of projects in a workspace where the user is invited",
    response_model=list[ProjectSummarySerializer],
    responses=ERROR_403 | ERROR_404 | ERROR_422,
)
async def list_workspace_invited_projects(workspace_id: B64UUID, request: AuthRequest) -> list[Project]:
    """
    Get all the invitations to projects that  a user has in a workspace
    """
    workspace = await get_workspace_or_404(id=workspace_id)
    await check_permissions(permissions=LIST_WORKSPACE_INVITED_PROJECTS, user=request.user, obj=workspace)
    return await projects_services.list_workspace_invited_projects_for_user(workspace=workspace, user=request.user)


##########################################################
# get project
##########################################################


@routes.projects.get(
    "/projects/{id}",
    name="project.get",
    summary="Get project",
    responses=PROJECT_DETAIL_200 | ERROR_403 | ERROR_404 | ERROR_422,
    response_model=None,
)
async def get_project(id: B64UUID, request: AuthRequest) -> ProjectDetailSerializer:
    """
    Get project detail by id.
    """

    project = await get_project_or_404(id)
    await check_permissions(permissions=GET_PROJECT, user=request.user, obj=project)
    return await projects_services.get_project_detail(project=project, user=request.user)


@routes.projects.get(
    "/projects/{id}/public-permissions",
    name="project.public-permissions.list",
    summary="List project public permissions",
    response_model=list[str],
    responses=ERROR_403 | ERROR_404 | ERROR_422,
)
async def list_project_public_permissions(id: B64UUID, request: AuthRequest) -> list[str]:
    """
    Get project public permissions
    """

    project = await get_project_or_404(id)
    await check_permissions(permissions=GET_PROJECT_PUBLIC_PERMISSIONS, user=request.user, obj=project)
    return project.public_permissions or []


##########################################################
# update project
##########################################################


@routes.projects.patch(
    "/projects/{id}",
    name="project.update",
    summary="Update project",
    responses=PROJECT_DETAIL_200 | ERROR_400 | ERROR_403 | ERROR_404 | ERROR_422,
    response_model=None,
)
async def update_project(
    id: B64UUID,
    request: AuthRequest,
    form: UpdateProjectValidator = Depends(UpdateProjectValidator.as_form),  # type: ignore[assignment, attr-defined]
) -> ProjectDetailSerializer:
    """
    Update project
    """
    project = await get_project_or_404(id)
    await check_permissions(permissions=UPDATE_PROJECT, user=request.user, obj=project)

    values = await form.cleaned_dict(request)
    return await projects_services.update_project(project=project, user=request.user, values=values)


@routes.projects.put(
    "/projects/{id}/public-permissions",
    name="project.public-permissions.put",
    summary="Edit project public permissions",
    response_model=list[str],
    responses=ERROR_400 | ERROR_403 | ERROR_404 | ERROR_422,
)
async def update_project_public_permissions(
    id: B64UUID,
    request: AuthRequest,
    form: PermissionsValidator,
) -> list[str]:
    """
    Edit project public permissions
    """

    project = await get_project_or_404(id)
    await check_permissions(permissions=UPDATE_PROJECT_PUBLIC_PERMISSIONS, user=request.user, obj=project)

    return await projects_services.update_project_public_permissions(project, form.permissions)


##########################################################
# delete project
##########################################################


@routes.projects.delete(
    "/projects/{id}",
    name="projects.delete",
    summary="Delete project",
    responses=ERROR_403 | ERROR_404 | ERROR_422,
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_project(id: B64UUID, request: AuthRequest) -> None:
    """
    Delete a project
    """
    project = await get_project_or_404(id)
    await check_permissions(permissions=DELETE_PROJECT, user=request.user, obj=project)

    await projects_services.delete_project(project=project, deleted_by=request.user)


##########################################################
# misc permissions
##########################################################


@routes.projects.get(
    "/my/projects/{id}/permissions",
    name="my.projects.permissions.list",
    summary="List my project permissions",
    response_model=list[str],
    responses=ERROR_404 | ERROR_422,
)
async def list_my_project_permissions(id: B64UUID, request: AuthRequest) -> list[str]:
    """
    List the computed permissions a user has over a project.
    """
    project = await get_project_or_404(id)
    return await permissions_services.get_user_permissions(user=request.user, obj=project)


##########################################################
# misc get project or 404
##########################################################


async def get_project_or_404(id: UUID) -> Project:
    project = await projects_services.get_project(id=id)
    if project is None:
        raise ex.NotFoundError("Project does not exist")

    return project
