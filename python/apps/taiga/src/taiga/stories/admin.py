# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


from taiga.base.db import admin
from taiga.stories.models import Story


@admin.register(Story)
class StoryAdmin(admin.ModelAdmin[Story]):
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "id",
                    "ref",
                    "name",
                    "order",
                    "created_by",
                    "created_at",
                    "project",
                    "workflow",
                    "status",
                )
            },
        ),
    )
    readonly_fields = ("id", "ref", "created_at", "created_by")
    list_display = ["ref", "name", "project", "workflow", "status", "order"]
    list_filter = ("project", "created_by", "workflow", "status")
    search_fields = [
        "id",
        "ref",
        "name",
        "project__name",
        "project__slug",
        "workflow__name",
        "workflow__slug",
        "status__name",
        "status__slug",
        "created_by__username",
        "created_by__email",
        "created_by__full_name",
    ]
    ordering = ("project__name", "workflow__order", "status__order", "order")
