# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


from taiga.base.db import admin
from taiga.workflows.models import Workflow, WorkflowStatus


class WorkflowStatusInline(admin.TabularInline[WorkflowStatus, Workflow]):
    model = WorkflowStatus
    extra = 0


@admin.register(Workflow)
class WorkflowAdmin(admin.ModelAdmin[Workflow]):
    fieldsets = ((None, {"fields": ("id", "name", "slug", "order")}),)
    readonly_fields = ("id", "created_at", "modified_at")
    list_display = ["project", "name", "slug", "order"]
    search_fields = ["id", "name", "slug", "project__name"]
    ordering = (
        "project__name",
        "order",
        "name",
    )
    inlines = [WorkflowStatusInline]
