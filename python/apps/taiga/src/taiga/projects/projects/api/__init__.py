# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from uuid import UUID

from fastapi import Query, status
from fastapi.params import Depends
from taiga.base.api import AuthRequest, responses
from taiga.base.api.permissions import check_permissions
from taiga.base.validators import B64UUID
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_400, ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import CanViewProject, HasPerm, IsAuthenticated, IsProjectAdmin
from taiga.permissions import services as permissions_services
from taiga.projects.projects import services as projects_services
from taiga.projects.projects.api.validators import PermissionsValidator, ProjectValidator, UpdateProjectValidator
from taiga.projects.projects.models import Project
from taiga.projects.projects.serializers import ProjectDetailSerializer, ProjectSummarySerializer
from taiga.routers import routes
from taiga.workspaces.workspaces.api import get_workspace_or_404

# PERMISSIONS
CREATE_PROJECT = HasPerm("view_workspace")
LIST_WORKSPACE_PROJECTS = IsAuthenticated()  # HasPerm("view_workspace")
LIST_WORKSPACE_INVITED_PROJECTS = IsAuthenticated()  # HasPerm("view_workspace")
GET_PROJECT = CanViewProject()
UPDATE_PROJECT = IsProjectAdmin()
GET_PROJECT_PUBLIC_PERMISSIONS = IsProjectAdmin()
UPDATE_PROJECT_PUBLIC_PERMISSIONS = IsProjectAdmin()
GET_PROJECT_WORKSPACE_MEMBER_PERMISSIONS = IsProjectAdmin()
UPDATE_PROJECT_WORKSPACE_MEMBER_PERMISSIONS = IsProjectAdmin()
DELETE_PROJECT = IsProjectAdmin()

# HTTP 200 RESPONSES
PROJECT_DETAIL_200 = responses.http_status_200(model=ProjectDetailSerializer)


##########################################################
# create project
##########################################################


@routes.projects.post(
    "",
    name="projects.create",
    summary="Create project",
    responses=PROJECT_DETAIL_200 | ERROR_400 | ERROR_404 | ERROR_422 | ERROR_403,
)
async def create_project(
    request: AuthRequest,
    form: ProjectValidator = Depends(ProjectValidator.as_form),  # type: ignore[assignment, attr-defined]
) -> ProjectDetailSerializer:
    """
    Create project for the logged user in a given workspace.
    """
    workspace = await get_workspace_or_404(id=form.workspace_id)
    await check_permissions(permissions=CREATE_PROJECT, user=request.user, obj=workspace)
    return await projects_services.create_project_api(
        workspace=workspace,
        name=form.name,
        description=form.description,
        color=form.color,
        owner=request.user,
        logo=form.logo,
    )


##########################################################
# list projects
##########################################################


@routes.workspaces.get(
    "/{workspace_id}/projects",
    name="workspace.projects.list",
    summary="List workspace projects",
    response_model=list[ProjectSummarySerializer],
    responses=ERROR_403 | ERROR_404,
)
async def list_workspace_projects(
    request: AuthRequest, workspace_id: B64UUID = Query("", description="the workspace id (B64UUID)")
) -> list[Project]:
    """
    List projects of a workspace visible by the user.
    """
    workspace = await get_workspace_or_404(id=workspace_id)
    await check_permissions(permissions=LIST_WORKSPACE_PROJECTS, user=request.user, obj=workspace)
    return await projects_services.list_workspace_projects_for_user(workspace=workspace, user=request.user)


@routes.workspaces.get(
    "/{workspace_id}/invited-projects",
    name="workspace.invited-projects.list",
    summary="List of projects in a workspace where the user is invited",
    response_model=list[ProjectSummarySerializer],
    responses=ERROR_403 | ERROR_404,
)
async def list_workspace_invited_projects(
    request: AuthRequest, workspace_id: B64UUID = Query(None, description="the workspace id (B64UUID)")
) -> list[Project]:
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
    "/{id}",
    name="project.get",
    summary="Get project",
    responses=PROJECT_DETAIL_200 | ERROR_404 | ERROR_422 | ERROR_403,
)
async def get_project(
    request: AuthRequest, id: B64UUID = Query("", description="the project id (B64UUID)")
) -> ProjectDetailSerializer:
    """
    Get project detail by id.
    """

    project = await get_project_or_404(id)
    await check_permissions(permissions=GET_PROJECT, user=request.user, obj=project)
    return await projects_services.get_project_detail(project=project, user=request.user)


@routes.projects.get(
    "/{id}/public-permissions",
    name="project.public-permissions.list",
    summary="List project public permissions",
    response_model=list[str],
    responses=ERROR_404 | ERROR_422 | ERROR_403,
)
async def list_project_public_permissions(
    request: AuthRequest, id: B64UUID = Query(None, description="the project id (B64UUID)")
) -> list[str]:
    """
    Get project public permissions
    """

    project = await get_project_or_404(id)
    await check_permissions(permissions=GET_PROJECT_PUBLIC_PERMISSIONS, user=request.user, obj=project)
    return project.public_permissions or []


@routes.projects.get(
    "/{id}/workspace-member-permissions",
    name="project.workspace-member-permissions.list",
    summary="List project workspace member permissions",
    response_model=list[str],
    responses=ERROR_400 | ERROR_404 | ERROR_422 | ERROR_403,
)
async def list_project_workspace_member_permissions(
    request: AuthRequest, id: B64UUID = Query(None, description="the project id (B64UUID)")
) -> list[str]:
    """
    Get project workspace member permissions
    """

    project = await get_project_or_404(id)
    await check_permissions(permissions=GET_PROJECT_WORKSPACE_MEMBER_PERMISSIONS, user=request.user, obj=project)

    return await projects_services.list_workspace_member_permissions(project=project)


##########################################################
# update project
##########################################################


@routes.projects.patch(
    "/{id}",
    name="project.update",
    summary="Update project",
    responses=PROJECT_DETAIL_200 | ERROR_400 | ERROR_404 | ERROR_422 | ERROR_403,
)
async def update_project(
    request: AuthRequest,
    id: B64UUID = Query("", description="the project id (B64UUID)"),
    form: UpdateProjectValidator = Depends(UpdateProjectValidator.as_form),  # type: ignore[assignment, attr-defined]
) -> ProjectDetailSerializer:
    """
    Update project
    """
    project = await get_project_or_404(id)
    await check_permissions(permissions=UPDATE_PROJECT, user=request.user, obj=project)

    values = await form.cleaned_dict(request)
    return await projects_services.update_project_api(project=project, user=request.user, values=values)


@routes.projects.put(
    "/{id}/public-permissions",
    name="project.public-permissions.put",
    summary="Edit project public permissions",
    response_model=list[str],
    responses=ERROR_400 | ERROR_404 | ERROR_422 | ERROR_403,
)
async def update_project_public_permissions(
    request: AuthRequest, form: PermissionsValidator, id: B64UUID = Query(None, description="the project id (B64UUID)")
) -> list[str]:
    """
    Edit project public permissions
    """

    project = await get_project_or_404(id)
    await check_permissions(permissions=UPDATE_PROJECT_PUBLIC_PERMISSIONS, user=request.user, obj=project)

    return await projects_services.update_project_public_permissions(project, form.permissions)


@routes.projects.put(
    "/{id}/workspace-member-permissions",
    name="project.workspace-member-permissions.put",
    summary="Edit project workspace member permissions",
    response_model=list[str],
    responses=ERROR_400 | ERROR_404 | ERROR_422 | ERROR_403,
)
async def update_project_workspace_member_permissions(
    request: AuthRequest, form: PermissionsValidator, id: B64UUID = Query(None, description="the project id (B64UUID)")
) -> list[str]:
    """
    Edit project workspace member permissions
    """

    project = await get_project_or_404(id)
    await check_permissions(permissions=UPDATE_PROJECT_WORKSPACE_MEMBER_PERMISSIONS, user=request.user, obj=project)

    return await projects_services.update_project_workspace_member_permissions(project, form.permissions)


##########################################################
# delete project
##########################################################

@routes.projects.delete(
    "/{id}",
    name="projects.delete",
    summary="Delete project",
    responses=ERROR_404 | ERROR_403,
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_project(
    request: AuthRequest,
    id: B64UUID = Query(None, description="the project id (B64UUID)"),
) -> None:
    """
    Delete a project
    """
    project = await get_project_or_404(id)
    await check_permissions(permissions=DELETE_PROJECT, user=request.user, obj=project)

    await projects_services.delete_project(project=project, deleted_by=request.user)



##########################################################
# misc permissions
##########################################################


@routes.my.get(
    "/projects/{id}/permissions",
    name="my.projects.permissions.list",
    summary="List my project permissions",
    response_model=list[str],
    responses=ERROR_404,
)
async def list_my_project_permissions(
    request: AuthRequest, id: B64UUID = Query(None, description="the project id (B64UUID)")
) -> list[str]:
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
        raise ex.NotFoundError(f"Project {id} does not exist")

    return project
