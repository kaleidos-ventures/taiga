# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any

from taiga.events import events_manager
from taiga.projects.projects.models import Project
from taiga.stories.events.content import CreateStoryContent, ReorderStoriesContent
from taiga.stories.models import Story
from taiga.stories.serializers import ReorderSerializer, ReorderStoriesSerializer, StorySerializer
from taiga.workflows.models import WorkflowStatus
from taiga.workflows.serializers.nested import WorkflowStatusNestedSerializer

CREATE_STORY = "stories.create"
REORDER_STORIES = "stories.reorder"


async def emit_event_when_story_is_created(story: Story) -> None:
    # Publish on the project channel
    if story:
        await events_manager.publish_on_project_channel(
            project=story.project, type=CREATE_STORY, content=CreateStoryContent(story=StorySerializer.from_orm(story))
        )


async def emit_when_stories_are_reordered(
    project: Project, status: WorkflowStatus, stories: list[int], reorder: dict[str, Any] | None = None
) -> None:

    if reorder:
        reorder_info = ReorderSerializer(**reorder)
    else:
        reorder_info = None

    # Publish on the project channel
    await events_manager.publish_on_project_channel(
        project=project,
        type=REORDER_STORIES,
        content=ReorderStoriesContent(
            reorder=ReorderStoriesSerializer(
                status=WorkflowStatusNestedSerializer(name=status.name, slug=status.slug, color=status.color),
                stories=stories,
                reorder=reorder_info,
            )
        ),
    )
