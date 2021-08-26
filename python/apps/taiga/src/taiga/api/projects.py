# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import APIRouter, HTTPException, Query
from taiga.models.projects import Project
from taiga.serializers.projects import ProjectSerializer
from taiga.services import projects as projects_services

metadata = {
    "name": "projects",
    "description": "Endpoint projects.",
}

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/", name="projects.list", summary="List projects", response_model=list[ProjectSerializer])
def list_projects(
    offset: int = Query(0, description="number of projects to skip"),
    limit: int = Query(100, description="number of projects to show"),
) -> list[Project]:
    """
    Get a paginated list of visible projects.
    """
    return projects_services.get_projects(offset=offset, limit=limit)


@router.get(
    "/{project_slug}", name="projects.get", summary="Get some project details", response_model=ProjectSerializer
)
def get_project(project_slug: str = Query(None, description="the project slug (string)")) -> Project:
    """
    Get project detail by slug.
    """
    project = projects_services.get_project(project_slug)

    if project is None:
        raise HTTPException(status_code=404, detail="API_NOT_FOUND")
    return project
