# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any, Type

from taiga.base.db import admin
from taiga.base.db.admin import forms
from taiga.base.db.admin.http import HttpRequest
from taiga.base.db.admin.users import UserAdmin as DjangoUserAdmin
from taiga.base.db.users import Group
from taiga.base.i18n import i18n
from taiga.projects.invitations.models import ProjectInvitation
from taiga.projects.memberships.models import ProjectMembership
from taiga.users.models import AuthData, User
from taiga.workspaces.memberships.models import WorkspaceMembership

admin.site.unregister(Group)


class ProjectInvitationInline(admin.TabularInline[ProjectInvitation, User]):
    model = ProjectInvitation
    fk_name = "user"
    fields = ("project", "role", "user", "email", "invited_by", "status", "num_emails_sent")
    readonly_fields = ("project", "role", "user", "email", "invited_by")
    extra = 0

    def has_add_permission(self, request: HttpRequest, obj: Any = None) -> bool:
        return False


class ProjectMembershipsInline(admin.TabularInline[ProjectMembership, User]):
    model = ProjectMembership
    fields = ("project", "role")
    extra = 0

    def has_change_permission(self, request: HttpRequest, obj: Any = None) -> bool:
        return False


class WorkspaceMembershipsInline(admin.TabularInline[WorkspaceMembership, User]):
    model = WorkspaceMembership
    fields = ("workspace",)
    extra = 0

    def has_change_permission(self, request: HttpRequest, obj: Any = None) -> bool:
        return False


class AuthDataInline(admin.TabularInline[AuthData, User]):
    model = AuthData
    extra = 0


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = (
        (None, {"fields": ("id", "username", "password")}),
        ("Personal info", {"fields": ("email", "full_name", "accepted_terms", "lang")}),
        ("Permissions", {"fields": ("is_active", "is_superuser")}),
        ("Important dates", {"fields": (("date_joined", "date_verification"), "last_login")}),
    )
    readonly_fields = ("id", "date_joined", "date_verification", "last_login")
    # add_fieldsets is not a standard ModelAdmin attribute. UserAdmin
    # overrides get_fieldsets to use this attribute when creating a user.
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("username", "email", "full_name", "password1", "password2")}),
    )
    list_display = ("username", "email", "full_name", "is_active", "is_superuser")
    list_filter = ("is_superuser", "is_active")
    search_fields = ("username", "full_name", "email")
    ordering = ("username",)
    filter_horizontal = ()
    inlines = [
        AuthDataInline,
        WorkspaceMembershipsInline,
        ProjectMembershipsInline,
        ProjectInvitationInline,
    ]

    def get_form(
        self, request: HttpRequest, obj: User | None = None, change: bool = False, **kwargs: Any
    ) -> Type[forms.ModelForm[User]]:
        form = super().get_form(request, obj, **kwargs)

        if "lang" in form.base_fields:
            # Use Select widget to get a dynamic choices for lang field
            form.base_fields["lang"].widget = forms.widgets.Select(
                choices=((lang.code, lang.english_name) for lang in i18n.available_languages_info)
            )

        return form
