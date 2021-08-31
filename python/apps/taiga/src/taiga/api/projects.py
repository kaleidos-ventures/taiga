# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import List

from fastapi import APIRouter, HTTPException, Query
from taiga.serializers.projects import ProjectSerializer
from taiga.services import projects as projects_services

metadata = {
    "name": "projects",
    "description": "Endpoint projects.",
}

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", name="projects.list", summary="List projects", response_model=List[ProjectSerializer])
def list_projects(
    offset: int = Query(0, description="number of projects to skip"),
    limit: int = Query(100, description="number of projects to show"),
) -> List[ProjectSerializer]:
    """
    Get a paginated list of visible projects.
    """
    qs = projects_services.get_projects(offset=offset, limit=limit)
    return ProjectSerializer.from_queryset(qs)


@router.get("/{project_slug}", name="projects.get", summary="Get project details", response_model=ProjectSerializer)
def get_project(project_slug: str = Query(None, description="the project slug (string)")) -> ProjectSerializer:
    """
    Get project detail by slug.
    """
    project = projects_services.get_project(project_slug)

    if project is None:
        raise HTTPException(status_code=404, detail="API_NOT_FOUND")

    return ProjectSerializer.from_orm(project)
