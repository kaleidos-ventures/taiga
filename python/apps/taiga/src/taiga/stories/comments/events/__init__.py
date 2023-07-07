# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import cast

from taiga.comments.models import Comment
from taiga.events import events_manager
from taiga.projects.projects.models import Project
from taiga.stories.comments.events.content import (
    CreateStoryCommentContent,
    DeleteStoryCommentContent,
    UpdateStoryCommentContent,
)
from taiga.stories.stories.models import Story
from taiga.users.models import User

CREATE_STORY_COMMENT = "stories.comments.create"
UPDATE_STORY_COMMENT = "stories.comments.update"
DELETE_STORY_COMMENT = "stories.comments.delete"


async def emit_event_when_story_comment_is_created(
    project: Project,
    comment: Comment,
) -> None:
    story = cast(Story, comment.content_object)

    await events_manager.publish_on_project_channel(
        project=project,
        type=CREATE_STORY_COMMENT,
        content=CreateStoryCommentContent(
            ref=story.ref,
            comment=comment,
        ),
    )


async def emit_event_when_story_comment_is_updated(
    project: Project,
    comment: Comment,
) -> None:
    story = cast(Story, comment.content_object)

    await events_manager.publish_on_project_channel(
        project=project,
        type=UPDATE_STORY_COMMENT,
        content=UpdateStoryCommentContent(
            ref=story.ref,
            comment=comment,
        ),
    )


async def emit_event_when_story_comment_is_deleted(
    project: Project,
    comment: Comment,
    deleted_by: User,
) -> None:
    story = cast(Story, comment.content_object)

    await events_manager.publish_on_project_channel(
        project=project,
        type=DELETE_STORY_COMMENT,
        content=DeleteStoryCommentContent(
            ref=story.ref,
            id=comment.id,
            deleted_by=deleted_by,
        ),
    )
