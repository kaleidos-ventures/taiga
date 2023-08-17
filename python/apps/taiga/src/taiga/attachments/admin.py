# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any

from taiga.attachments.models import Attachment
from taiga.base.db import admin
from taiga.base.db.admin.http import HttpRequest
from taiga.base.db.admin.utils import linkify


class AttachmentInline(admin.GenericTabularInline):
    model = Attachment
    ct_field = "object_content_type"
    ct_fk_field = "object_id"
    fields = ("name", "file", "content_type", "size")
    readonly_fields = ("name", "file", "content_type", "size")
    show_change_link = True

    def has_change_permission(self, request: HttpRequest, obj: Any = None) -> bool:
        return False

    def has_add_permission(self, request: HttpRequest, obj: Any = None) -> bool:
        return False


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin[Attachment]):
    fieldsets = (
        (
            None,
            {
                "fields": (
                    ("id", "b64id"),
                    ("name", "size", "content_type"),
                    "file",
                    ("created_at", "created_by"),
                    ("object_content_type", "object_id"),
                    "content_object_link",
                )
            },
        ),
    )
    list_display = (
        "b64id",
        "name",
        "content_object_link" "created_by",
    )
    readonly_fields = (
        "id",
        "b64id",
        "created_at",
        "created_by",
        "content_object_link",
    )
    search_fields = (
        "name",
        "content_type",
    )
    list_filter = ("object_content_type",)
    ordering = ("-created_at",)

    @admin.display(description="Related to object")
    def content_object_link(self, obj: Attachment) -> str:
        return linkify(object=obj, field_name="content_object")
