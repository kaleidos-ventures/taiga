# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.events import events_manager
from taiga.notifications.events.content import CreateNotificationContent, ReadNotificationsContent
from taiga.notifications.models import Notification
from taiga.users.models import User

CREATE_NOTIFICATION = "notifications.create"
READ_NOTIFICATIONS = "notifications.read"


async def emit_event_when_notifications_are_created(
    notifications: list[Notification],
) -> None:
    for notification in notifications:
        await events_manager.publish_on_user_channel(
            user=notification.owner,
            type=CREATE_NOTIFICATION,
            content=CreateNotificationContent(
                notification=notification,
            ),
        )


async def emit_event_when_notifications_are_read(user: User, notifications: list[Notification]) -> None:
    await events_manager.publish_on_user_channel(
        user=user,
        type=READ_NOTIFICATIONS,
        content=ReadNotificationsContent(
            notifications_ids=[n.id for n in notifications],
        ),
    )
