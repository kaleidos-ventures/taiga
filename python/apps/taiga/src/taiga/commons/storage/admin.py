# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.db import admin
from taiga.commons.storage.models import StoragedObject


@admin.register(StoragedObject)
class StoragedObjectAdmin(admin.ModelAdmin[StoragedObject]):
    list_display = (
        "id",
        "file",
        "created_at",
        "deleted_at",
    )
    readonly_fields = (
        "created_at",
        "deleted_at",
    )
    search_fields = ("file",)
    list_filter = ("created_at", "deleted_at")
    ordering = ("-created_at",)
