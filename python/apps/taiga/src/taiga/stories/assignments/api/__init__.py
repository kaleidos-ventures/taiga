# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from uuid import UUID

from fastapi import Query, status
from taiga.base.api import AuthRequest
from taiga.base.api.permissions import check_permissions
from taiga.base.validators import B64UUID
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import HasPerm
from taiga.routers import routes
from taiga.stories.assignments import services as story_assignments_services
from taiga.stories.assignments.api.validators import StoryAssignmentValidator
from taiga.stories.assignments.models import StoryAssignment
from taiga.stories.assignments.serializers import StoryAssignmentSerializer
from taiga.stories.stories.api import get_story_or_404

# PERMISSIONS
CREATE_STORY_ASSIGNMENT = HasPerm("modify_story")
DELETE_STORY_ASSIGNMENT = HasPerm("modify_story")


################################################
# assign story (create assignment)
################################################


@routes.projects.post(
    "/{project_id}/stories/{ref}/assignments",
    name="project.story.assignments.create",
    summary="Create story assignment",
    response_model=StoryAssignmentSerializer,
    responses=ERROR_404 | ERROR_422 | ERROR_403,
)
async def create_story_assignment(
    request: AuthRequest,
    form: StoryAssignmentValidator,
    project_id: B64UUID = Query(None, description="the project id (B64UUID)"),
    ref: int = Query(None, description="the unique story reference within a project (str)"),
) -> StoryAssignment:
    """
    Create a story assignment
    """
    story = await get_story_or_404(project_id, ref)
    await check_permissions(permissions=CREATE_STORY_ASSIGNMENT, user=request.user, obj=story)

    return await story_assignments_services.create_story_assignment(
        project_id=project_id, story=story, username=form.username
    )


################################################
# unassign story (delete assginment)
################################################


@routes.projects.delete(
    "/{project_id}/stories/{ref}/assignments/{username}",
    name="project.story.assignments.delete",
    summary="Delete story assignment",
    responses=ERROR_404 | ERROR_403,
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_story_assignment(
    request: AuthRequest,
    project_id: B64UUID = Query(None, description="the project id (B64UUID)"),
    ref: int = Query(None, description="the unique story reference within a project (str)"),
    username: str = Query(None, description="the username of the assigned user"),
) -> None:
    """
    Delete a story assignment
    """
    story_assignment = await get_story_assignment_or_404(project_id, ref, username)
    await check_permissions(permissions=DELETE_STORY_ASSIGNMENT, user=request.user, obj=story_assignment.story)

    await story_assignments_services.delete_story_assignment(story_assignment=story_assignment)


################################################
# misc get story assignment or 404
################################################


async def get_story_assignment_or_404(project_id: UUID, ref: int, username: str) -> StoryAssignment:
    story_assignment = await story_assignments_services.get_story_assignment(
        project_id=project_id, ref=ref, username=username
    )
    if story_assignment is None:
        raise ex.NotFoundError(f"{username} is not assigned to story {ref}")

    return story_assignment
