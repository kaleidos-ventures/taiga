# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.db import admin
from taiga.base.db.admin.utils import linkify
from taiga.comments.models import Comment


class _CalculatedCommentAttrsMixin:
    @admin.display(boolean=True)
    def was_modified(self, obj: Comment) -> bool:
        return bool(obj.modified_at)

    @admin.display(boolean=True)
    def was_deleted(self, obj: Comment) -> bool:
        return bool(obj.deleted_at)

    @admin.display(description="Related to object")
    def content_object_link(self, obj: Comment) -> str:
        return linkify(object=obj, field_name="content_object")


class CommentInline(_CalculatedCommentAttrsMixin, admin.GenericTabularInline):
    model = Comment
    ct_field = "object_content_type"
    ct_fk_field = "object_id"
    fields = ("b64id", "text", "created_at", "created_by", "was_modified", "was_deleted")
    readonly_fields = ("b64id", "created_at", "created_by", "was_modified", "was_deleted")
    show_change_link = True
    extra = 0


@admin.register(Comment)
class CommentAdmin(_CalculatedCommentAttrsMixin, admin.ModelAdmin[Comment]):
    fieldsets = (
        (
            None,
            {
                "fields": (
                    ("id", "b64id"),
                    "text",
                    ("created_at", "created_by"),
                    "modified_at",
                    ("deleted_at", "deleted_by"),
                    (
                        "object_content_type",
                        "object_id",
                    ),
                    "content_object_link",
                )
            },
        ),
    )
    readonly_fields = (
        "id",
        "b64id",
        "created_at",
        "created_by",
        "modified_at",
        "deleted_at",
        "deleted_by",
        "content_object_link",
    )
    list_display = ("b64id", "text", "created_by", "was_modified", "was_deleted", "content_object_link")
    list_filter = ("created_by",)
    search_fields = (
        "id",
        "text",
        "object_id",
    )
    ordering = ("-created_at",)
