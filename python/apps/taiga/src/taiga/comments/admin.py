# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.db import admin
from taiga.comments.models import Comment


class CommentInline(admin.GenericTabularInline):
    model = Comment
    ct_field = "object_content_type"
    ct_fk_field = "object_id"
    fields = ("b64id", "text", "created_by", "created_at")
    readonly_fields = ("b64id",)
    show_change_link = True


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin[Comment]):
    fieldsets = (
        (None, {"fields": (("id", "b64id"), "text", "created_by", "created_at", ("object_content_type", "object_id"))}),
    )
    readonly_fields = (
        "id",
        "b64id",
    )
    list_display = (
        "b64id",
        "text",
        "created_by",
        "content_object",
    )
    list_filter = ("created_by",)
    search_fields = (
        "id",
        "text",
        "object_id",
    )
    ordering = ("-created_at",)
