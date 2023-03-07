# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any

from taiga.base.db import admin
from taiga.base.db.admin.forms import ModelChoiceField
from taiga.base.db.admin.http import HttpRequest
from taiga.base.db.models import ForeignKey
from taiga.workspaces.memberships.models import WorkspaceMembership
from taiga.workspaces.roles.models import WorkspaceRole
from taiga.workspaces.workspaces.models import Workspace


class WorkspaceRoleInline(admin.TabularInline[WorkspaceRole, Workspace]):
    model = WorkspaceRole
    extra = 0


class WorkspaceMembershipInline(admin.TabularInline[WorkspaceMembership, Workspace]):
    model = WorkspaceMembership
    extra = 0

    def get_formset(self, request: HttpRequest, obj: Workspace | None = None, **kwargs: Any) -> Any:
        self.parent_obj = obj  # Use in formfield_for_foreignkey()
        return super().get_formset(request, obj, **kwargs)

    def formfield_for_foreignkey(
        self, db_field: ForeignKey[Any, Any], request: HttpRequest, **kwargs: Any
    ) -> ModelChoiceField:
        if db_field.name in ["role"]:
            kwargs["queryset"] = db_field.related_model.objects.filter(workspace=self.parent_obj)

        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin[Workspace]):
    fieldsets = (
        (None, {"fields": (("id", "b64id"), "name", "created_by")}),
        ("Extra info", {"classes": ("collapse",), "fields": ("color", ("created_at", "modified_at"))}),
        ("Permissions", {"fields": ("is_premium",)}),
    )
    readonly_fields = ("id", "b64id", "created_at", "modified_at")
    list_display = ["b64id", "name", "created_by", "is_premium"]
    list_filter = ("is_premium", "created_by")
    search_fields = ["id", "name"]
    ordering = ("name",)
    inlines = [
        WorkspaceRoleInline,
        WorkspaceMembershipInline,
    ]
