# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from collections.abc import Iterable
from datetime import datetime
from typing import Any, TypedDict
from uuid import UUID

from taiga.base.db.models import QuerySet
from taiga.base.utils.datetime import aware_utcnow
from taiga.notifications.models import Notification
from taiga.users.models import User

##########################################################
# filters and querysets
##########################################################

DEFAULT_QUERYSET = Notification.objects.select_related("created_by").all()


class NotificationFilters(TypedDict, total=False):
    id: UUID
    owner: User
    is_read: bool
    read_before: datetime


async def _apply_filters_to_queryset(
    qs: QuerySet[Notification],
    filters: NotificationFilters = {},
) -> QuerySet[Notification]:
    filter_data = dict(filters.copy())

    if "is_read" in filter_data:
        is_read = filter_data.pop("is_read")
        filter_data["read_at__isnull"] = not is_read
    if "read_before" in filter_data:
        read_before = filter_data.pop("read_before")
        filter_data["read_at__lt"] = read_before

    return qs.filter(**filter_data)


##########################################################
# create notifications
##########################################################


async def create_notifications(
    owners: Iterable[User],
    created_by: User,
    notification_type: str,
    content: dict[str, Any],
) -> list[Notification]:
    notifications = [
        Notification(
            owner=owner,
            created_by=created_by,
            type=notification_type,
            content=content,
        )
        for owner in owners
    ]

    return await Notification.objects.abulk_create(notifications)


##########################################################
# list notifications
##########################################################


async def list_notifications(
    filters: NotificationFilters = {},
    offset: int | None = None,
    limit: int | None = None,
) -> list[Notification]:
    qs = await _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)

    if limit is not None and offset is not None:
        limit += offset

    return [a async for a in qs[offset:limit]]


##########################################################
# get notifications
##########################################################


async def get_notification(
    filters: NotificationFilters = {},
) -> Notification | None:
    qs = await _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)

    try:
        return await qs.aget()
    except Notification.DoesNotExist:
        return None


##########################################################
# mark notificatiosn as read
##########################################################


async def mark_notifications_as_read(
    filters: NotificationFilters = {},
) -> list[Notification]:
    qs = await _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    await qs.aupdate(read_at=aware_utcnow())
    return [a async for a in qs.all()]


##########################################################
# delete notifications
##########################################################


async def delete_notifications(filters: NotificationFilters = {}) -> int:
    qs = await _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    count, _ = await qs.adelete()
    return count


##########################################################
# misc
##########################################################


async def count_notifications(
    filters: NotificationFilters = {},
) -> int:
    qs = await _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)

    return await qs.acount()
