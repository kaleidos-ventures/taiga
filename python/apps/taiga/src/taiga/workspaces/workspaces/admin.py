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
from taiga.base.db.models import ForeignKey, QuerySet
from taiga.users.models import User
from taiga.workspaces.memberships.models import WorkspaceMembership
from taiga.workspaces.workspaces.models import Workspace


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


class WorkspaceNonMembersInline(admin.NonrelatedTabularInline[User, Workspace]):
    model = User
    fields = ["username", "full_name", "list_projects"]
    extra = 0
    readonly_fields = (
        "username",
        "full_name",
        "list_projects",
    )
    verbose_name = "Workspace non member"

    def list_projects(self, obj: User) -> list[str]:
        return list(obj.projects.filter(workspace=self.parent_obj).values_list("name", flat=True))

    def get_form_queryset(self, obj: Workspace | None = None) -> QuerySet[User]:
        if not obj:
            return self.model.objects.none()
        self.parent_obj = obj  # Use in list_projects
        qs = self.model.objects.exclude(workspaces=self.parent_obj)
        qs = qs.filter(projects__workspace=self.parent_obj).distinct()
        return qs

    # This will help you to disbale add functionality
    def has_add_permission(self, request: HttpRequest, obj: User | None = None) -> bool:
        return False

    # This will help you to disable delete functionaliyt
    def has_delete_permission(self, request: HttpRequest, obj: User | None = None) -> bool:
        return False


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
    inlines = [WorkspaceMembershipInline, WorkspaceNonMembersInline]
