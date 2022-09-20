# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any

from taiga.base.db import models
from taiga.base.utils.slug import slugify_uniquely


class Workspace(models.BaseModel):
    name = models.CharField(max_length=40, null=False, blank=False, verbose_name="name")
    slug = models.LowerSlugField(max_length=250, unique=True, null=False, blank=True, verbose_name="slug")
    color = models.IntegerField(null=False, blank=False, default=1, verbose_name="color")

    created_at = models.DateTimeField(null=False, blank=False, auto_now_add=True, verbose_name="created at")
    modified_at = models.DateTimeField(null=False, blank=False, auto_now=True, verbose_name="modified at")

    owner = models.ForeignKey(
        "users.User",
        null=False,
        blank=False,
        related_name="owned_workspaces",
        on_delete=models.PROTECT,
        verbose_name="owner",
    )

    members = models.ManyToManyField(
        "users.User",
        related_name="workspaces",
        through="memberships.WorkspaceMembership",
        through_fields=("workspace", "user"),
        verbose_name="members",
    )

    is_premium = models.BooleanField(null=False, blank=True, default=False, verbose_name="is premium")

    class Meta:
        verbose_name = "workspace"
        verbose_name_plural = "workspaces"
        ordering = ["slug"]
        index_together = [
            ["name", "id"],
        ]

    def __str__(self) -> str:
        return self.slug

    def __repr__(self) -> str:
        return f"<Workspace {self.slug}>"

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self.slug:
            self.slug = slugify_uniquely(self.name, self.__class__)

        super().save(*args, **kwargs)
