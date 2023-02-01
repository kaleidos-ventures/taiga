# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.events import events_manager
from taiga.projects.projects.models import Project
from taiga.stories.stories.events.content import (
    CreateStoryContent,
    DeleteStoryContent,
    ReorderStoriesContent,
    UpdateStoryContent,
)
from taiga.stories.stories.serializers import ReorderStoriesSerializer, StoryDetailSerializer
from taiga.users.models import AnyUser

CREATE_STORY = "stories.create"
UPDATE_STORY = "stories.update"
REORDER_STORIES = "stories.reorder"
DELETE_STORY = "stories.delete"


async def emit_event_when_story_is_created(project: Project, story: StoryDetailSerializer) -> None:
    await events_manager.publish_on_project_channel(
        project=project,
        type=CREATE_STORY,
        content=CreateStoryContent(story=story),
    )


async def emit_event_when_story_is_updated(
    project: Project, story: StoryDetailSerializer, updates_attrs: list[str]
) -> None:
    await events_manager.publish_on_project_channel(
        project=project,
        type=UPDATE_STORY,
        content=UpdateStoryContent(
            story=story,
            updates_attrs=updates_attrs,
        ),
    )


async def emit_when_stories_are_reordered(project: Project, reorder: ReorderStoriesSerializer) -> None:
    await events_manager.publish_on_project_channel(
        project=project,
        type=REORDER_STORIES,
        content=ReorderStoriesContent(reorder=reorder),
    )


async def emit_event_when_story_is_deleted(project: Project, ref: int, deleted_by: AnyUser) -> None:
    await events_manager.publish_on_project_channel(
        project=project,
        type=DELETE_STORY,
        content=DeleteStoryContent(ref=ref, deleted_by=deleted_by),
    )
