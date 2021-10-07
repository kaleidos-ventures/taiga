# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import logging
from typing import List

from fastapi import APIRouter, Query
from taiga.base.api import Request
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_401, ERROR_404, ERROR_422
from taiga.serializers.projects import ProjectSerializer
from taiga.services import projects as projects_services
from taiga.validators.projects import ProjectValidator

logger = logging.getLogger(__name__)

metadata = {
    "name": "projects",
    "description": "Endpoint for projects resources.",
}

router = APIRouter(prefix="/projects", tags=["projects"], responses=ERROR_401)
router2 = APIRouter(prefix="/workspaces/{workspace_slug}/projects", tags=["workspaces"], responses=ERROR_401)


@router2.get(
    "", name="projects.list", summary="List projects", response_model=List[ProjectSerializer], responses=ERROR_422
)
def list_projects(workspace_slug: str = Query(None, description="the workspace slug (str)")) -> List[ProjectSerializer]:
    """
    List projects of a workspace.
    """
    projects = projects_services.get_projects(workspace_slug=workspace_slug)
    return ProjectSerializer.from_queryset(projects)


@router.post(
    "",
    name="projects.create",
    summary="Create project",
    response_model=ProjectSerializer,
    responses=ERROR_422,
)
def create_project(form: ProjectValidator, request: Request) -> ProjectSerializer:
    """
    Create project for the logged user.
    """
    project = projects_services.create_project(
        workspace_slug=form.workspace_slug,
        name=form.name,
        description=form.description,
        color=form.color,
        owner=request.user,
    )
    return ProjectSerializer.from_orm(project)


@router.get(
    "/{project_slug}",
    name="projects.get",
    summary="Get project",
    response_model=ProjectSerializer,
    responses=ERROR_404 | ERROR_422,
)
def get_project(project_slug: str = Query(None, description="the project slug (str)")) -> ProjectSerializer:
    """
    Get project detail by slug.
    """
    project = projects_services.get_project(project_slug)

    if project is None:
        logger.exception(f"Project {project_slug} does not exist")
        raise ex.NotFoundError()

    return ProjectSerializer.from_orm(project)
