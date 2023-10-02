# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any

from taiga.base.db import admin
from taiga.base.db.admin.http import HttpRequest
from taiga.notifications.models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin[Notification]):
    list_display = ("id", "type", "owner", "created_at", "read_at")

    def has_change_permission(self, request: HttpRequest, obj: Any = None) -> bool:
        return False

    def has_add_permission(self, request: HttpRequest, obj: Any = None) -> bool:
        return False
