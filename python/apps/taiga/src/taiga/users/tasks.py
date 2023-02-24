# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from taiga.conf import settings
from taiga.tasksqueue.manager import manager as tqmanager
from taiga.users import services as users_services


@tqmanager.periodic(cron=settings.CLEAN_EXPIRED_USERS_CRON)  # type: ignore
@tqmanager.task
async def clean_expired_users(timestamp: int) -> None:
    await users_services.clean_expired_users()
