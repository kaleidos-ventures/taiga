# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from slugify import slugify
from taiga.base.db import models
from taiga.base.db.mixins import CreatedMetaInfoMixin, ModifiedAtMetaInfoMixin


class Workspace(models.BaseModel, CreatedMetaInfoMixin, ModifiedAtMetaInfoMixin):
    name = models.CharField(max_length=40, null=False, blank=False, verbose_name="name")
    color = models.IntegerField(null=False, blank=False, default=1, verbose_name="color")

    members = models.ManyToManyField(
        "users.User",
        related_name="workspaces",
        through="workspaces_memberships.WorkspaceMembership",
        through_fields=("workspace", "user"),
        verbose_name="members",
    )

    class Meta:
        verbose_name = "workspace"
        verbose_name_plural = "workspaces"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

    def __repr__(self) -> str:
        return f"<Workspace {self.name}>"

    @property
    def slug(self) -> str:
        return slugify(self.name)
