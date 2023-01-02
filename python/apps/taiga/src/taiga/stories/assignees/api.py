# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import Query
from taiga.base.api import AuthRequest
from taiga.base.api.permissions import check_permissions
from taiga.base.validators import B64UUID
from taiga.exceptions.api.errors import ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import HasPerm
from taiga.routers import routes
from taiga.stories.assignees import services as story_assignees_services
from taiga.stories.assignees.models import StoryAssignee
from taiga.stories.assignees.serializers import StoryAssigneeSerializer
from taiga.stories.assignees.validators import StoryAssigneeValidator
from taiga.stories.stories.api import get_story_or_404

# PERMISSIONS
CREATE_STORY_ASSIGNEE = HasPerm("modify_story")


################################################
# STORY ASSIGNEE
################################################


@routes.projects.post(
    "/{project_id}/stories/{ref}/assignees",
    name="project.story.assignees.create",
    summary="Create story assignee",
    response_model=StoryAssigneeSerializer,
    responses=ERROR_404 | ERROR_422 | ERROR_403,
)
async def create_story_assignee(
    request: AuthRequest,
    form: StoryAssigneeValidator,
    project_id: B64UUID = Query(None, description="the project id (B64UUID)"),
    ref: int = Query(None, description="the unique story reference within a project (str)"),
) -> StoryAssignee:
    """
    Create a story assignee
    """
    story = await get_story_or_404(project_id, ref)
    await check_permissions(permissions=CREATE_STORY_ASSIGNEE, user=request.user, obj=story)

    return await story_assignees_services.create_story_assignee(
        project_id=project_id, story=story, username=form.username
    )
