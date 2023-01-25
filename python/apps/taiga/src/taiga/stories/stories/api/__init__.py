# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from uuid import UUID

from fastapi import Depends, Query
from starlette.responses import Response
from taiga.base.api import AuthRequest, PaginationQuery, set_pagination
from taiga.base.api.permissions import check_permissions
from taiga.base.validators import B64UUID
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import HasPerm
from taiga.routers import routes
from taiga.stories.stories import services as stories_services
from taiga.stories.stories.api.validators import ReorderStoriesValidator, StoryValidator, UpdateStoryValidator
from taiga.stories.stories.models import Story
from taiga.stories.stories.serializers import ReorderStoriesSerializer, StoryDetailSerializer, StorySummarySerializer
from taiga.workflows.api import get_workflow_or_404

# PERMISSIONS
LIST_STORIES = HasPerm("view_story")
GET_STORY = HasPerm("view_story")
CREATE_STORY = HasPerm("add_story")
UPDATE_STORY = HasPerm("modify_story")
REORDER_STORIES = HasPerm("modify_story")


################################################
# create story
################################################


@routes.projects.post(
    "/{project_id}/workflows/{workflow_slug}/stories",
    name="project.stories.create",
    summary="Create an story",
    response_model=StoryDetailSerializer,
    responses=ERROR_404 | ERROR_422 | ERROR_403,
)
async def create_story(
    request: AuthRequest,
    form: StoryValidator,
    project_id: B64UUID = Query(None, description="the project id (B64UUID)"),
    workflow_slug: str = Query(None, description="the workflow slug (str)"),
) -> StoryDetailSerializer:
    """
    Creates a story in the given project workflow
    """
    workflow = await get_workflow_or_404(project_id=project_id, workflow_slug=workflow_slug)
    await check_permissions(permissions=CREATE_STORY, user=request.user, obj=workflow)

    return await stories_services.create_story(
        title=form.title, project=workflow.project, workflow=workflow, status_slug=form.status, user=request.user
    )


################################################
# list stories
################################################


@routes.projects.get(
    "/{project_id}/workflows/{workflow_slug}/stories",
    name="project.stories.list",
    summary="List stories",
    response_model=list[StorySummarySerializer],
    responses=ERROR_404 | ERROR_403,
)
async def list_stories(
    request: AuthRequest,
    response: Response,
    pagination_params: PaginationQuery = Depends(),
    project_id: B64UUID = Query(None, description="the project id (B64UUID)"),
    workflow_slug: str = Query(None, description="the workflow slug (str)"),
) -> list[StorySummarySerializer]:
    """
    List all the stories for a project workflow
    """
    workflow = await get_workflow_or_404(project_id=project_id, workflow_slug=workflow_slug)
    await check_permissions(permissions=LIST_STORIES, user=request.user, obj=workflow)

    pagination, stories = await stories_services.list_paginated_stories(
        project_id=project_id,
        workflow_slug=workflow_slug,
        offset=pagination_params.offset,
        limit=pagination_params.limit,
    )

    set_pagination(response=response, pagination=pagination)

    return stories


################################################
# get story
################################################


@routes.projects.get(
    "/{project_id}/stories/{ref}",
    name="project.stories.get",
    summary="Get story",
    response_model=StoryDetailSerializer,
    responses=ERROR_404 | ERROR_403,
)
async def get_story(
    request: AuthRequest,
    project_id: B64UUID = Query(None, description="the project id (B64UUID)"),
    ref: int = Query(None, description="the unique story reference within a project (str)"),
) -> StoryDetailSerializer:
    """
    Get the detailed information of an story.
    """
    story = await get_story_or_404(project_id=project_id, ref=ref)
    await check_permissions(permissions=GET_STORY, user=request.user, obj=story)

    return await stories_services.get_detailed_story(project_id=project_id, ref=ref)


################################################
# update story
################################################


@routes.projects.patch(
    "/{project_id}/stories/{ref}",
    name="project.stories.update",
    summary="Update story",
    response_model=StoryDetailSerializer,
    responses=ERROR_404 | ERROR_403,
)
async def update_story(
    request: AuthRequest,
    form: UpdateStoryValidator,
    project_id: B64UUID = Query(None, description="the project id (B64UUID)"),
    ref: int = Query(None, description="the unique story reference within a project (str)"),
) -> StoryDetailSerializer:
    """
    Update an story from a project.
    """
    story = await get_story_or_404(project_id, ref)
    await check_permissions(permissions=UPDATE_STORY, user=request.user, obj=story)

    values = form.dict(exclude_unset=True)
    current_version = values.pop("version")
    return await stories_services.update_story(story=story, current_version=current_version, values=values)


################################################
# reorder stories
################################################


@routes.projects.post(
    "/{project_id}/workflows/{workflow_slug}/stories/reorder",
    name="project.stories.reorder",
    summary="Reorder stories",
    response_model=ReorderStoriesSerializer,
    responses=ERROR_404 | ERROR_422 | ERROR_403,
)
async def reorder_stories(
    request: AuthRequest,
    form: ReorderStoriesValidator,
    project_id: B64UUID = Query(None, description="the project id (B64UUID)"),
    workflow_slug: str = Query(None, description="the workflow slug (str)"),
) -> ReorderStoriesSerializer:
    """
    Reorder one or more stories; it may change priority and/or status
    """
    workflow = await get_workflow_or_404(project_id=project_id, workflow_slug=workflow_slug)
    await check_permissions(permissions=REORDER_STORIES, user=request.user, obj=workflow)

    return await stories_services.reorder_stories(
        project=workflow.project,
        workflow=workflow,
        target_status_slug=form.status,
        stories_refs=form.stories,
        reorder=form.get_reorder_dict(),
    )


################################################
# misc: get story or 404
################################################


async def get_story_or_404(project_id: UUID, ref: int) -> Story:
    story = await stories_services.get_story(project_id=project_id, ref=ref)
    if story is None:
        raise ex.NotFoundError(f"Story {ref} does not exist in project {project_id}")

    return story