# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import Depends, Query
from starlette.responses import Response
from taiga.base.api import AuthRequest, PaginationQuery, set_pagination
from taiga.base.api.permissions import check_permissions
from taiga.exceptions.api.errors import ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import HasPerm
from taiga.projects.projects.api import get_project_or_404
from taiga.routers import routes
from taiga.stories import services as stories_services
from taiga.stories.models import Story
from taiga.stories.serializers import ReorderStoriesSerializer, StorySerializer
from taiga.stories.validators import ReorderStoriesValidator, StoryValidator
from taiga.workflows.api import get_workflow_or_404

# PERMISSIONS
CREATE_STORY = HasPerm("add_story")
LIST_STORIES = HasPerm("view_story")
REORDER_STORIES = HasPerm("modify_story")


################################################
# STORIES
################################################


@routes.projects.post(
    "/{project_slug}/workflows/{workflow_slug}/stories",
    name="project.stories.create",
    summary="Create a story in a workflow status",
    response_model=StorySerializer,
    responses=ERROR_404 | ERROR_422 | ERROR_403,
)
async def create_story(
    request: AuthRequest,
    form: StoryValidator,
    project_slug: str = Query(None, description="the project slug (str)"),
    workflow_slug: str = Query(None, description="the workflow slug (str)"),
) -> Story:
    """
    Creates a story for the logged user in the given workflow and status
    """
    project = await get_project_or_404(project_slug)
    await check_permissions(permissions=CREATE_STORY, user=request.user, obj=project)
    workflow = await get_workflow_or_404(project_slug=project_slug, workflow_slug=workflow_slug)

    return await stories_services.create_story(
        title=form.title, project=project, workflow=workflow, status_slug=form.status, user=request.user
    )


@routes.projects.get(
    "/{project_slug}/workflows/{workflow_slug}/stories",
    name="project.stories.get",
    summary="List all the stories for a project workflow",
    response_model=list[StorySerializer],
    responses=ERROR_404 | ERROR_403,
)
async def list_stories(
    request: AuthRequest,
    response: Response,
    pagination_params: PaginationQuery = Depends(),
    project_slug: str = Query(None, description="the project slug (str)"),
    workflow_slug: str = Query(None, description="the workflow slug (str)"),
) -> list[Story]:
    """
    List all the stories for a project workflow and all of its statuses
    """
    project = await get_project_or_404(project_slug)
    await check_permissions(permissions=LIST_STORIES, user=request.user, obj=project)
    await get_workflow_or_404(project_slug=project_slug, workflow_slug=workflow_slug)

    pagination, stories = await stories_services.get_paginated_stories_by_workflow(
        project_slug=project_slug,
        workflow_slug=workflow_slug,
        offset=pagination_params.offset,
        limit=pagination_params.limit,
    )

    set_pagination(response=response, pagination=pagination)

    return stories


@routes.projects.post(
    "/{project_slug}/workflows/{workflow_slug}/stories/reorder",
    name="project.stories.reorder",
    summary="Reorder stories in kanban; change priority and/or status",
    response_model=ReorderStoriesSerializer,
    responses=ERROR_404 | ERROR_422 | ERROR_403,
)
async def reorder_stories(
    request: AuthRequest,
    response: Response,
    form: ReorderStoriesValidator,
    project_slug: str = Query(None, description="the project slug (str)"),
    workflow_slug: str = Query(None, description="the workflow slug (str)"),
) -> ReorderStoriesSerializer:
    """
    Reorder one or more stories in the kanban; it may change priority and/or status
    """
    project = await get_project_or_404(project_slug)
    await check_permissions(permissions=REORDER_STORIES, user=request.user, obj=project)
    workflow = await get_workflow_or_404(project_slug=project_slug, workflow_slug=workflow_slug)

    resp = await stories_services.reorder_stories(
        project=project,
        workflow=workflow,
        target_status_slug=form.status,
        stories_refs=form.stories,
        reorder=form.get_reorder_dict(),
    )

    return ReorderStoriesSerializer(**resp)
