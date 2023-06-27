# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.db import admin
from taiga.base.db.admin.http import HttpRequest
from taiga.base.db.models import Count, QuerySet
from taiga.comments.admin import CommentInline
from taiga.mediafiles.admin import MediafileInline
from taiga.stories.stories.models import Story


@admin.register(Story)
class StoryAdmin(admin.ModelAdmin[Story]):
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "id",
                    "ref",
                    "title",
                    "description",
                    "order",
                    "project",
                    "workflow",
                    "status",
                )
            },
        ),
        (
            "Extra info",
            {
                "classes": ("collapse",),
                "fields": (
                    "created_by",
                    "created_at",
                    "title_updated_by",
                    "title_updated_at",
                    "description_updated_by",
                    "description_updated_at",
                ),
            },
        ),
    )
    readonly_fields = (
        "id",
        "ref",
        "created_by",
        "created_at",
        "title_updated_by",
        "title_updated_at",
        "description_updated_by",
        "description_updated_at",
    )
    list_display = ["ref", "title", "project", "workflow", "status", "order", "total_mediafiles", "total_comments"]
    list_filter = ("project", "created_by")
    search_fields = [
        "id",
        "ref",
        "title",
        "description",
        "project__name",
        "workflow__name",
    ]
    ordering = ("project__name", "workflow__order", "status__order", "order")
    inlines = [
        MediafileInline,
        CommentInline,
    ]

    def get_queryset(self, request: HttpRequest) -> QuerySet[Story]:
        queryset = super().get_queryset(request)
        queryset = queryset.annotate(
            comments_count=Count("comments"),
            mediafiles_count=Count("mediafiles"),
        )
        return queryset

    @admin.display(description="# comments", ordering="comments_count")
    def total_comments(self, obj: Story) -> int:
        return obj.comments_count  # type: ignore[attr-defined]

    @admin.display(description="# mediafiles", ordering="mediafiles_count")
    def total_mediafiles(self, obj: Story) -> int:
        return obj.mediafiles_count  # type: ignore[attr-defined]
