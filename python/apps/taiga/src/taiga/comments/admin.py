# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any

from taiga.base.db import admin
from taiga.base.db.admin.http import HttpRequest
from taiga.comments.models import Comment


class CommentInline(admin.GenericTabularInline):
    model = Comment
    ct_field = "object_content_type"
    ct_fk_field = "object_id"
    fields = ("text",)
    show_change_link = True

    def has_change_permission(self, request: HttpRequest, obj: Any = None) -> bool:
        return False

    def has_add_permission(self, request: HttpRequest, obj: Any = None) -> bool:
        return False


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin[Comment]):
    list_filter = ("object_content_type", "object_id")
    list_display = (
        "text",
        "created_by",
        "object_id",
        "content_object",
    )
    list_display_links = ("text",)
    search_fields = (
        "id",
        "text",
        "object_id",
    )
    ordering = ("-created_at", "-modified_at")
