# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import Query
from fastapi.params import Depends
from taiga.auth.routing import AuthAPIRouter
from taiga.base.api import Request
from taiga.base.api.permissions import check_permissions
from taiga.exceptions import api as ex
from taiga.exceptions import services as services_ex
from taiga.exceptions.api.errors import ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import HasPerm, IsProjectAdmin
from taiga.projects import services as projects_services
from taiga.projects.models import Project
from taiga.projects.serializers import ProjectSerializer, ProjectSummarySerializer
from taiga.projects.validators import PermissionsValidator, ProjectValidator
from taiga.workspaces import services as workspaces_services
from taiga.workspaces.api import get_workspace_or_404

metadata = {
    "name": "projects",
    "description": "Endpoint for projects resources.",
}

router = AuthAPIRouter(prefix="/projects", tags=["projects"])
router_workspaces = AuthAPIRouter(prefix="/workspaces/{workspace_slug}/projects", tags=["workspaces"])

# PERMISSIONS
LIST_WORKSPACE_PROJECTS = HasPerm("view_workspace")
CREATE_PROJECT = HasPerm("view_workspace")
GET_PROJECT = HasPerm("view_project")
GET_PROJECT_PUBLIC_PERMISSIONS = IsProjectAdmin()
UPDATE_PROJECT_PUBLIC_PERMISSIONS = IsProjectAdmin()


@router_workspaces.get(
    "",
    name="workspace.projects.list",
    summary="List workspace projects",
    response_model=list[ProjectSummarySerializer],
    responses=ERROR_422 | ERROR_403,
)
def list_workspace_projects(
    request: Request, workspace_slug: str = Query("", description="the workspace slug (str)")
) -> list[ProjectSerializer]:
    """
    List projects of a workspace visible by the user.
    """
    workspace = get_workspace_or_404(slug=workspace_slug)

    check_permissions(permissions=LIST_WORKSPACE_PROJECTS, user=request.user, obj=workspace)

    projects = projects_services.get_workspace_projects_for_user(workspace=workspace, user=request.user)
    return ProjectSerializer.from_queryset(projects)


@router.post(
    "",
    name="projects.create",
    summary="Create project",
    response_model=ProjectSerializer,
    responses=ERROR_422 | ERROR_403,
)
def create_project(
    request: Request,
    form: ProjectValidator = Depends(ProjectValidator.as_form),  # type: ignore[assignment, attr-defined]
) -> ProjectSerializer:
    """
    Create project for the logged user in a given workspace.
    """
    workspace = workspaces_services.get_workspace(slug=form.workspace_slug)

    check_permissions(permissions=CREATE_PROJECT, user=request.user, obj=workspace)

    project = projects_services.create_project(
        workspace=workspace,
        name=form.name,
        description=form.description,
        color=form.color,
        owner=request.user,
        logo=form.logo,
    )

    return ProjectSerializer.from_orm(project)


@router.get(
    "/{slug}",
    name="projects.get",
    summary="Get project",
    response_model=ProjectSerializer,
    responses=ERROR_404 | ERROR_422 | ERROR_403,
)
def get_project(request: Request, slug: str = Query("", description="the project slug (str)")) -> ProjectSerializer:
    """
    Get project detail by slug.
    """

    project = get_project_or_404(slug)
    check_permissions(permissions=GET_PROJECT, user=request.user, obj=project)
    return ProjectSerializer.from_orm(project)


@router.get(
    "/{slug}/public-permissions",
    name="project.public-permissions.get",
    summary="Get project public permissions",
    response_model=list[str],
    responses=ERROR_404 | ERROR_422 | ERROR_403,
)
def get_project_public_permissions(
    request: Request, slug: str = Query(None, description="the project slug (str)")
) -> list[str]:
    """
    Get project public permissions
    """

    project = get_project_or_404(slug)
    check_permissions(permissions=GET_PROJECT_PUBLIC_PERMISSIONS, user=request.user, obj=project)
    public_permissions = project.public_permissions
    return public_permissions


@router.put(
    "/{slug}/public-permissions",
    name="project.public-permissions.put",
    summary="Edit project public permissions",
    response_model=list[str],
    responses=ERROR_404 | ERROR_422 | ERROR_403,
)
def update_project_public_permissions(
    request: Request, form: PermissionsValidator, slug: str = Query(None, description="the project slug (str)")
) -> list[str]:
    """
    Edit project public permissions
    """

    project = get_project_or_404(slug)
    check_permissions(permissions=UPDATE_PROJECT_PUBLIC_PERMISSIONS, user=request.user, obj=project)

    try:
        public_permissions = projects_services.update_project_public_permissions(project, form.permissions)
        return public_permissions
    except services_ex.NotValidPermissionsSetError:
        raise ex.BadRequest("One or more permissions are not valid. Maybe, there is a typo.")
    except services_ex.IncompatiblePermissionsSetError:
        raise ex.BadRequest("Given permissions are incompatible")


def get_project_or_404(slug: str) -> Project:
    project = projects_services.get_project(slug=slug)
    if project is None:
        raise ex.NotFoundError(f"Project {slug} does not exist")

    return project
