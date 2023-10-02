# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.notifications import services as notifications_services
from taiga.stories.assignments.notifications.content import (
    StoryAssignNotificationContent,
    StoryUnassignNotificationContent,
)
from taiga.stories.stories.models import Story
from taiga.users.models import User

STORIES_ASSIGN = "stories.assign"
STORIES_UNASSIGN = "stories.unassign"


async def notify_when_story_is_assigned(story: Story, assigned_to: User, emitted_by: User) -> None:
    """
    Emit notification when a story is assigned.
    """
    notified_users = {assigned_to}
    if story.created_by:
        notified_users.add(story.created_by)
    notified_users.discard(emitted_by)

    await notifications_services.notify_users(
        type=STORIES_ASSIGN,
        emitted_by=emitted_by,
        notified_users=notified_users,
        content=StoryAssignNotificationContent(
            project=story.project, story=story, assigned_by=emitted_by, assigned_to=assigned_to
        ),
    )


async def notify_when_story_is_unassigned(story: Story, unassigned_to: User, emitted_by: User) -> None:
    """
    Emit notification when story is unassigned.
    """
    notified_users = {unassigned_to}
    if story.created_by:
        notified_users.add(story.created_by)
    notified_users.discard(emitted_by)

    await notifications_services.notify_users(
        type=STORIES_UNASSIGN,
        emitted_by=emitted_by,
        notified_users=notified_users,
        content=StoryUnassignNotificationContent(
            project=story.project, story=story, unassigned_by=emitted_by, unassigned_to=unassigned_to
        ),
    )
