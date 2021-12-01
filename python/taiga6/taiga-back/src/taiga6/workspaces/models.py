# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import random
import re

from django.conf import settings
from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.utils.translation import ugettext_lazy as _
from django.utils import timezone
from django.utils.functional import cached_property
from django.template.defaultfilters import slugify
from django.core import validators
from django_pglocks import advisory_lock

from taiga6.base.utils.time import timestamp_ms
from taiga6.base.utils.slug import slugify_uniquely
from taiga6.permissions.choices import ANON_PERMISSIONS, WORKSPACE_MEMBERS_PERMISSIONS


class WorkspaceMembership(models.Model):
    # This model stores all workspace memberships. Also
    # stores invitations to memberships that does not have
    # assigned user.

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        default=None,
        related_name="workspace_memberships",
        on_delete=models.CASCADE,
    )
    workspace = models.ForeignKey(
        "Workspace",
        null=False,
        blank=False,
        related_name="workspace_memberships",
        on_delete=models.CASCADE,
    )
    workspace_role = models.ForeignKey(
        "users.WorkspaceRole",
        null=False,
        blank=False,
        related_name="workspace_memberships",
        on_delete=models.CASCADE,
    )

    class Meta:
        verbose_name = "workspace membership"
        verbose_name_plural = "workspace memberships"
        unique_together = ("user", "workspace",)
        ordering = ["workspace", "user__full_name", "user__username", "user__email"]

    def get_related_people(self):
        related_people = get_user_model().objects.filter(id=self.user.id)
        return related_people

    def clean(self):
        # TODO: Review and do it more robust
        workspace_memberships = WorkspaceMembership.objects.filter(user=self.user, workspace=self.workspace)
        if self.user and workspace_memberships.count() > 0 and workspace_memberships[0].id != self.id:
            raise ValidationError(_('The user is already member of the workspace'))


class Workspace(models.Model):
    name = models.CharField(max_length=40, null=False, blank=False, verbose_name=_("name"))
    slug = models.SlugField(max_length=250, unique=True, null=True, blank=True,
                            verbose_name=_("slug"))
    color = models.IntegerField(default=1, null=False,
                                blank=False, verbose_name=_("color"))

    created_date = models.DateTimeField(null=False, blank=False,
                                        verbose_name=_("created date"),
                                        default=timezone.now)
    modified_date = models.DateTimeField(null=False, blank=False,
                                         verbose_name=_("modified date"),
                                        default=timezone.now)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=False,
        blank=True,
        related_name="owned_workspaces",
        verbose_name=_("owner"),
        on_delete=models.PROTECT,
    )
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="workspaces",
                                     through="WorkspaceMembership", verbose_name=_("members"),
                                     through_fields=("workspace", "user"))
    anon_permissions = ArrayField(models.TextField(null=False, blank=False, choices=ANON_PERMISSIONS),
                                  null=True, blank=True, default=list, verbose_name=_("anonymous permissions"))
    public_permissions = ArrayField(models.TextField(null=False, blank=False, choices=WORKSPACE_MEMBERS_PERMISSIONS),
                                    null=True, blank=True, default=list, verbose_name=_("user permissions"))


    class Meta:
        verbose_name = "workspace"
        verbose_name_plural = "workspaces"
        ordering = ["name", "id"]
        index_together = [
            ["name", "id"],
        ]

    def __str__(self):
        return self.slug

    def __repr__(self):
        return "<Workspace {0}>".format(self.id)

    def save(self, *args, **kwargs):
        if self.anon_permissions is None:
            self.anon_permissions = []

        if self.public_permissions is None:
            self.public_permissions = []

        if not self.slug:
            with advisory_lock("workspace-creation"):
                self.slug = slugify_uniquely(self.name, self.__class__)
                super().save(*args, **kwargs)
        else:
            super().save(*args, **kwargs)

    @cached_property
    def cached_workspace_memberships(self):
        return {wm.user.id: wm for wm in self.workspace_memberships.exclude(user__isnull=True)
                                                      .select_related("user", "workspace", "workspace_role")}

    def cached_workspace_memberships_for_user(self, user):
        return self.cached_workspace_memberships.get(user.id, None)
