# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.events import events_manager
from taiga.stories.events.content import CreateStoryContent
from taiga.stories.models import Story
from taiga.stories.serializers import StorySerializer

CREATE_STORY = "stories.create"


async def emit_event_when_story_is_created(story: Story) -> None:
    # Publish on the project channel
    if story:
        await events_manager.publish_on_project_channel(
            project=story.project, type=CREATE_STORY, content=CreateStoryContent(story=StorySerializer.from_orm(story))
        )
