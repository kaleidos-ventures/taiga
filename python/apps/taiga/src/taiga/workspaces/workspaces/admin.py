# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.db import admin
from taiga.workspaces.memberships.admin import WorkspaceMembershipInline
from taiga.workspaces.workspaces.models import Workspace


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin[Workspace]):
    fieldsets = (
        (None, {"fields": (("id", "b64id"), "name", "created_by")}),
        ("Extra info", {"classes": ("collapse",), "fields": ("color", ("created_at", "modified_at"))}),
    )
    readonly_fields = ("id", "b64id", "created_at", "modified_at")
    list_display = ["b64id", "name", "created_by"]
    list_filter = ["created_by"]
    search_fields = ["id", "name"]
    ordering = ("name",)
    inlines = [
        WorkspaceMembershipInline,
    ]
