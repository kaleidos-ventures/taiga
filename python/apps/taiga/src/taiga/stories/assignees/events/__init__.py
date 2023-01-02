# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.events import events_manager
from taiga.stories.assignees.events.content import CreateStoryAssigneeContent
from taiga.stories.assignees.models import StoryAssignee
from taiga.stories.assignees.serializers import StoryAssigneeSerializer

CREATE_STORY_ASSIGNEE = "stories_assignees.create"


async def emit_event_when_story_assignee_is_created(story_assignee: StoryAssignee) -> None:
    await events_manager.publish_on_user_channel(
        user=story_assignee.user,
        type=CREATE_STORY_ASSIGNEE,
        content=CreateStoryAssigneeContent(story_assignee=StoryAssigneeSerializer.from_orm(story_assignee)),
    )

    await events_manager.publish_on_project_channel(
        project=story_assignee.story.project,
        type=CREATE_STORY_ASSIGNEE,
        content=CreateStoryAssigneeContent(story_assignee=StoryAssigneeSerializer.from_orm(story_assignee)),
    )
