# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.api import AuthRequest
from taiga.base.api.permissions import check_permissions
from taiga.exceptions.api.errors import ERROR_403
from taiga.notifications import services as notifications_services
from taiga.notifications.models import Notification
from taiga.notifications.serializers import NotificationCountersSerializer, NotificationSerializer
from taiga.permissions import IsAuthenticated
from taiga.routers import routes

LIST_MY_NOTIFICATIONS = IsAuthenticated()
COUNT_MY_NOTIFICATIONS = IsAuthenticated()

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
