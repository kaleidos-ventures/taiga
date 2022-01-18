# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from django.contrib import admin
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html

from taiga6.users.admin import WorkspaceRoleInline

from . import models


class WorkspaceMembershipInline(admin.TabularInline):
    model = models.WorkspaceMembership
    extra = 0

    def get_formset(self, request, obj=None, **kwargs):
        # Hack! Hook parent obj just in time to use in formfield_for_foreignkey
        self.parent_obj = obj
        return super(WorkspaceMembershipInline, self).get_formset(request, obj, **kwargs)


class WorkspaceAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "slug", "color", "owner_url", "created_date"]
    list_display_links = ["id", "name", "slug"]
    search_fields = ["id", "name", "slug", "owner__username", "owner__email", "owner__full_name"]
    inlines = [WorkspaceRoleInline,
               WorkspaceMembershipInline]

    fieldsets = (
        (None, {
            "fields": ("name",
                       "slug",
                       "color",
                       ("created_date", "modified_date"))
        }),
        (_("Privacy"), {
            "fields": (("owner"),
                       ("anon_permissions", "public_permissions"))
        })
    )

    def owner_url(self, obj):
        if obj.owner:
            url = reverse('admin:{0}_{1}_change'.format(obj.owner._meta.app_label,
                                                        obj.owner._meta.model_name),
                          args=(obj.owner.pk,))
            return format_html("<a href='{url}' title='{user}'>{user}</a>", url=url, user=obj.owner)
        return ""
    owner_url.short_description = _('owner')

admin.site.register(models.Workspace, WorkspaceAdmin)
