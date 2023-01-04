# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.events import events_manager
from taiga.stories.assignments.events.content import CreateStoryAssignmentContent
from taiga.stories.assignments.models import StoryAssignment
from taiga.stories.assignments.serializers import StoryAssignmentSerializer

CREATE_STORY_ASSIGNMENT = "stories_assignments.create"


async def emit_event_when_story_assignment_is_created(story_assignment: StoryAssignment) -> None:
    await events_manager.publish_on_user_channel(
        user=story_assignment.user,
        type=CREATE_STORY_ASSIGNMENT,
        content=CreateStoryAssignmentContent(story_assignment=StoryAssignmentSerializer.from_orm(story_assignment)),
    )

    await events_manager.publish_on_project_channel(
        project=story_assignment.story.project,
        type=CREATE_STORY_ASSIGNMENT,
        content=CreateStoryAssignmentContent(story_assignment=StoryAssignmentSerializer.from_orm(story_assignment)),
    )
