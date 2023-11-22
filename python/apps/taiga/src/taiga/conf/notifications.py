# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from pydantic import BaseSettings


class NotificationsSettings(BaseSettings):
    CLEAN_READ_NOTIFICATIONS_CRON: str = "30 * * * *"  # default: every hour at minute 30.
    MINUTES_TO_STORE_READ_NOTIFICATIONS: int = 2 * 60  # 120 minutes
