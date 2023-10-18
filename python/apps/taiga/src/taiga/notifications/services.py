# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from collections.abc import Iterable
from uuid import UUID

from taiga.base.serializers import BaseModel
from taiga.notifications import events as notifications_events
from taiga.notifications import repositories as notifications_repositories
from taiga.notifications.models import Notification
from taiga.notifications.repositories import NotificationFilters
from taiga.users.models import User


async def notify_users(type: str, emitted_by: User, notified_users: Iterable[User], content: BaseModel) -> None:
    notifications = await notifications_repositories.create_notifications(
        owners=notified_users,
        created_by=emitted_by,
        notification_type=type,
        content=content.dict(),
    )
    await notifications_events.emit_event_when_notifications_are_created(notifications=notifications)


async def list_user_notifications(user: User, is_read: bool | None = None) -> list[Notification]:
    filters: NotificationFilters = {"owner": user}

    if is_read is not None:
        filters["is_read"] = is_read

    return await notifications_repositories.list_notifications(filters=filters)


async def get_user_notification(user: User, id: UUID) -> Notification | None:
    return await notifications_repositories.get_notification(filters={"owner": user, "id": id})


async def mark_user_notifications_as_read(user: User, id: UUID | None = None) -> list[Notification]:
    filters: NotificationFilters = {"owner": user}

    if id is not None:
        filters["id"] = id

    notifications = await notifications_repositories.mark_notifications_as_read(filters=filters)

    if notifications:
        await notifications_events.emit_event_when_notifications_are_read(user=user, notifications=notifications)

    return notifications


async def count_user_notifications(user: User) -> dict[str, int]:
    total = await notifications_repositories.count_notifications(filters={"owner": user})
    read = await notifications_repositories.count_notifications(filters={"owner": user, "is_read": True})
    return {"total": total, "read": read, "unread": total - read}
