# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any

from taiga.base.repositories.neighbors import Neighbor
from taiga.stories.stories.models import Story
from taiga.stories.stories.serializers import ReorderStoriesSerializer, StoryDetailSerializer, StorySummarySerializer
from taiga.users.models import User
from taiga.workflows.models import WorkflowStatus


def serialize_story_detail(
    story: Story,
    neighbors: Neighbor[Story],
    assignees: list[User] = [],
) -> StoryDetailSerializer:

    return StoryDetailSerializer(
        ref=story.ref,
        title=story.title,
        status=story.status,
        workflow=story.workflow,
        created_by=story.created_by,
        created_at=story.created_at,
        version=story.version,
        assignees=assignees,
        prev=neighbors.prev,
        next=neighbors.next,
    )


def serialize_story_list(
    story: Story,
    assignees: list[User] = [],
) -> StorySummarySerializer:

    return StorySummarySerializer(
        ref=story.ref,
        title=story.title,
        status=story.status,
        version=story.version,
        assignees=assignees,
    )


def serialize_reorder_story(
    status: WorkflowStatus, stories: list[int], reorder: dict[str, Any] | None = None
) -> ReorderStoriesSerializer:

    return ReorderStoriesSerializer(status=status, stories=stories, reorder=reorder)