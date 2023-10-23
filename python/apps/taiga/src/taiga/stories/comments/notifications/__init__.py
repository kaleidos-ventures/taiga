# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.comments.models import Comment
from taiga.notifications import services as notifications_services
from taiga.stories.comments.notifications.content import StoryCommentCreateNotificationContent
from taiga.stories.stories.models import Story
from taiga.users.models import User

STORY_COMMENT_CREATE = "story_comment.create"


async def notify_when_story_comment_is_created(story: Story, comment: Comment, emitted_by: User) -> None:
    notified_users = {u async for u in story.assignees.all()}
    if story.created_by:
        notified_users.add(story.created_by)
    notified_users.discard(emitted_by)

    await notifications_services.notify_users(
        type=STORY_COMMENT_CREATE,
        emitted_by=emitted_by,
        notified_users=notified_users,
        content=StoryCommentCreateNotificationContent(
            project=story.project,
            story=story,
            commented_by=emitted_by,
            comment=comment,
        ),
    )
