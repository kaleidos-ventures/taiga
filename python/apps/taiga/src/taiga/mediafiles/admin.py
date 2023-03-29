# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any

from taiga.base.db import admin
from taiga.base.db.admin.http import HttpRequest
from taiga.mediafiles.models import Mediafile


class MediafileInline(admin.GenericTabularInline):
    model = Mediafile
    ct_field = "object_content_type"
    ct_fk_field = "object_id"
    fields = ("name", "file", "content_type", "size")
    readonly_fields = ("name", "file", "content_type", "size")

    def has_change_permission(self, request: HttpRequest, obj: Any = None) -> bool:
        return False

    def has_add_permission(self, request: HttpRequest, obj: Any = None) -> bool:
        return False


@admin.register(Mediafile)
class StoryAdmin(admin.ModelAdmin[Mediafile]):
    list_filter = ("project", "object_content_type")
    list_display = (
        "name",
        "project",
        "content_object",
        "object_content_type",
    )
    search_fields = (
        "name",
        "content_type",
    )
