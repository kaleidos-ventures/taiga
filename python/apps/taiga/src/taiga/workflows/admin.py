# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from taiga.base.db import admin
from taiga.projects.projects.models import Project
from taiga.workflows.models import Workflow, WorkflowStatus


class WorkflowStatusInline(admin.TabularInline[WorkflowStatus, Workflow]):
    model = WorkflowStatus
    extra = 0


@admin.register(Workflow)
class WorkflowAdmin(admin.ModelAdmin[Workflow]):
    fieldsets = ((None, {"fields": ("id", "name", "slug", "order", "project")}),)
    readonly_fields = ("id", "created_at", "modified_at")
    list_display = ["name", "project", "slug", "order"]
    search_fields = ["id", "name", "slug", "project__name"]
    ordering = (
        "project__name",
        "order",
        "name",
    )
    inlines = [WorkflowStatusInline]


class WorkflowInline(admin.TabularInline[Workflow, Project]):
    model = Workflow
    extra = 0
