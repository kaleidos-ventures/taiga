# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from datetime import timedelta

from taiga.base.utils.datetime import aware_utcnow
from taiga.commons.storage import services as storage_services
from taiga.conf import settings
from taiga.tasksqueue.manager import manager as tqmanager


@tqmanager.periodic(cron=settings.STORAGE.CLEAN_DELETED_STORAGE_OBJECTS_CRON)  # type: ignore
@tqmanager.task
async def clean_deleted_storaged_objects(timestamp: int) -> int:
    return await storage_services.clean_deleted_storaged_objects(
        before=aware_utcnow() - timedelta(days=settings.STORAGE.DAYS_TO_STORE_DELETED_STORAGED_OBJECTS)
    )
