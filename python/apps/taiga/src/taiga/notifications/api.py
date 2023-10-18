# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from uuid import UUID

from taiga.base.api import AuthRequest
from taiga.base.api.permissions import check_permissions
from taiga.base.validators import B64UUID
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_403, ERROR_404, ERROR_422
from taiga.notifications import services as notifications_services
from taiga.notifications.models import Notification
from taiga.notifications.serializers import NotificationCountersSerializer, NotificationSerializer
from taiga.permissions import IsAuthenticated
from taiga.routers import routes
from taiga.users.models import User

LIST_MY_NOTIFICATIONS = IsAuthenticated()
COUNT_MY_NOTIFICATIONS = IsAuthenticated()
MARK_MY_NOTIFICATIONS_AS_READ = IsAuthenticated()

##########################################################
# list notifications
##########################################################


@routes.notifications.get(
    "/my/notifications",
    name="my.notifications.list",
    summary="List all the user notifications",
    responses=ERROR_403,
    response_model=list[NotificationSerializer],
)
async def list_my_notifications(request: AuthRequest, read: bool | None = None) -> list[Notification]:
    """
    List the notifications of the logged user.
    """
    await check_permissions(permissions=LIST_MY_NOTIFICATIONS, user=request.user, obj=None)
    return await notifications_services.list_user_notifications(user=request.user, is_read=read)


##########################################################
# count notifications
##########################################################


@routes.notifications.get(
    "/my/notifications/count",
    name="my.notifications.count",
    summary="Get user notifications counters",
    responses=ERROR_403,
    response_model=NotificationCountersSerializer,
)
async def count_my_notifications(request: AuthRequest) -> dict[str, int]:
    """
    Get user notifications counters
    """
    await check_permissions(permissions=COUNT_MY_NOTIFICATIONS, user=request.user, obj=None)
    return await notifications_services.count_user_notifications(user=request.user)


##########################################################
# mark notification as read
##########################################################


@routes.notifications.post(
    "/my/notifications/{id}/read",
    name="my.notifications.read",
    summary="Mark notification as read",
    responses=ERROR_403 | ERROR_404 | ERROR_422,
    response_model=NotificationSerializer,
)
async def mark_my_notification_as_read(id: B64UUID, request: AuthRequest) -> Notification:
    """
    Mark a notification as read.
    """
    await check_permissions(permissions=MARK_MY_NOTIFICATIONS_AS_READ, user=request.user, obj=None)
    await get_notification_or_404(user=request.user, id=id)
    return (await notifications_services.mark_user_notifications_as_read(user=request.user, id=id))[0]


##########################################################
# misc
##########################################################


async def get_notification_or_404(user: User, id: UUID) -> Notification:
    notification = await notifications_services.get_user_notification(user=user, id=id)
    if notification is None:
        raise ex.NotFoundError("Notification does not exist")

    return notification
