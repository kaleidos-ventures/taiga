# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.notifications import services as notifications_services
from taiga.stories.stories.models import Story
from taiga.stories.stories.notifications.content import (
    StoryDeleteNotificationContent,
    StoryStatusChangeNotificationContent,
)
from taiga.users.models import User

STORIES_STATUS_CHANGE = "stories.status_change"
STORIES_DELETE = "stories.delete"


async def notify_when_story_status_change(story: Story, status: str, emitted_by: User) -> None:
    """
    Emit notification when a story status changes
    """
    notified_users = {u async for u in story.assignees.all()}
    if story.created_by:
        notified_users.add(story.created_by)
    notified_users.discard(emitted_by)

    await notifications_services.notify_users(
        type=STORIES_STATUS_CHANGE,
        emitted_by=emitted_by,
        notified_users=notified_users,
        content=StoryStatusChangeNotificationContent(
            projects=story.project,
            story=story,
            changed_by=emitted_by,
            status=status,
        ),
    )


async def notify_when_story_is_deleted(story: Story, emitted_by: User) -> None:
    """
    Emit notification when a story is deleted
    """
    notified_users = set()
    if story.created_by:
        notified_users.add(story.created_by)
    notified_users.discard(emitted_by)

    await notifications_services.notify_users(
        type=STORIES_DELETE,
        emitted_by=emitted_by,
        notified_users=notified_users,
        content=StoryDeleteNotificationContent(
            projects=story.project,
            story=story,
            deleted_by=emitted_by,
        ),
    )
