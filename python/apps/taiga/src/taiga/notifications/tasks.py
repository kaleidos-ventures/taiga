# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import logging
from datetime import timedelta

from taiga.base.utils.datetime import aware_utcnow
from taiga.conf import settings
from taiga.notifications import services as notifications_services
from taiga.tasksqueue.manager import manager as tqmanager

logger = logging.getLogger(__name__)


@tqmanager.periodic(cron=settings.NOTIFICATIONS.CLEAN_READ_NOTIFICATIONS_CRON)  # type: ignore
@tqmanager.task
async def clean_read_notifications(timestamp: int) -> int:
    total_deleted = await notifications_services.clean_read_notifications(
        before=aware_utcnow() - timedelta(minutes=settings.NOTIFICATIONS.MINUTES_TO_STORE_READ_NOTIFICATIONS)
    )

    logger.info(
        "deleted notifications: %s",
        total_deleted,
        extra={"deleted": total_deleted},
    )

    return total_deleted
