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
from taiga.projects.invitations.models import ProjectInvitation
from taiga.projects.memberships.models import ProjectMembership
from taiga.projects.projects.models import Project, ProjectTemplate
from taiga.projects.roles.models import ProjectRole


class ProjectRoleInline(admin.TabularInline[ProjectRole, Project]):
    model = ProjectRole
    fields = ("project", "name", "slug", "order", "is_admin", "permissions")
    extra = 0


class ProjectMembershipInline(admin.TabularInline[ProjectMembership, Project]):
    model = ProjectMembership
    fields = ("project", "role", "user")
    extra = 0

    def get_formset(self, request: HttpRequest, obj: Project | None = None, **kwargs: Any) -> Any:
        self.parent_obj = obj  # Use in formfield_for_foreignkey()
        return super().get_formset(request, obj, **kwargs)

    def formfield_for_foreignkey(
        self, db_field: ForeignKey[Any, Any], request: HttpRequest, **kwargs: Any
    ) -> ModelChoiceField:
        if db_field.name in ["role"]:
            kwargs["queryset"] = db_field.related_model.objects.filter(project=self.parent_obj)

        return super().formfield_for_foreignkey(db_field, request, **kwargs)


class ProjectInvitationInline(admin.TabularInline[ProjectInvitation, Project]):
    model = ProjectInvitation
    extra = 0

    def get_formset(self, request: HttpRequest, obj: Project | None = None, **kwargs: Any) -> Any:
        self.parent_obj = obj  # Use in formfield_for_foreignkey()
        return super().get_formset(request, obj, **kwargs)

    def formfield_for_foreignkey(
        self, db_field: ForeignKey[Any, Any], request: HttpRequest, **kwargs: Any
    ) -> ModelChoiceField:
        if db_field.name in ["role"]:
            kwargs["queryset"] = db_field.related_model.objects.filter(project=self.parent_obj)

        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin[Project]):
    fieldsets = (
        (None, {"fields": (("id", "b64id"), "workspace", "name", "created_by")}),
        (
            "Extra info",
            {"classes": ("collapse",), "fields": ("color", "logo", ("created_at", "modified_at"))},
        ),
        ("Permissions", {"fields": ("public_permissions",)}),
    )
    readonly_fields = ("id", "b64id", "created_at", "modified_at")
    list_display = ["b64id", "name", "workspace", "created_by", "public_user_can_view", "anon_user_can_view"]
    list_filter = ("workspace", "created_by")
    search_fields = [
        "id",
        "name",
        "workspace__name",
    ]
    ordering = ("name",)
    inlines = [ProjectRoleInline, ProjectMembershipInline, ProjectInvitationInline]

    @admin.display(description="allow public users", boolean=True)
    def public_user_can_view(self, obj: Project) -> bool:
        return obj.public_user_can_view

    @admin.display(description="allow anonymous users", boolean=True)
    def anon_user_can_view(self, obj: Project) -> bool:
        return obj.anon_user_can_view


@admin.register(ProjectTemplate)
class ProjectTemplateAdmin(admin.ModelAdmin[ProjectTemplate]):
    ...
