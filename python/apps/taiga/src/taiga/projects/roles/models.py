# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any

from taiga.base.db import models
from taiga.base.utils.datetime import timestamp_mics
from taiga.base.utils.slug import slugify_uniquely
from taiga.permissions.choices import ProjectPermissions


class ProjectRole(models.BaseModel):
    name = models.CharField(max_length=200, null=False, blank=False, verbose_name="name")
    slug = models.LowerSlugField(max_length=250, null=False, blank=True, verbose_name="slug")
    permissions = models.ArrayField(
        models.TextField(null=False, blank=False, choices=ProjectPermissions.choices),
        null=True,
        blank=True,
        default=list,
        verbose_name="permissions",
    )
    order = models.BigIntegerField(default=timestamp_mics, null=False, blank=False, verbose_name="order")
    is_admin = models.BooleanField(null=False, blank=False, default=False, verbose_name="is_admin")
    project = models.ForeignKey(
        "projects.Project",
        null=False,
        blank=False,
        related_name="roles",
        on_delete=models.CASCADE,
        verbose_name="project",
    )

    class Meta:
        verbose_name = "project role"
        verbose_name_plural = "project roles"
        constraints = [
            models.UniqueConstraint(fields=["project", "slug"], name="%(app_label)s_%(class)s_unique_project_slug"),
            models.UniqueConstraint(fields=["project", "name"], name="%(app_label)s_%(class)s_unique_project_name"),
        ]
        indexes = [
            models.Index(fields=["project", "slug"]),
        ]
        ordering = ["project", "order", "name"]

    def __str__(self) -> str:
        return self.name

    def __repr__(self) -> str:
        return f"<ProjectRole {self.project} {self.slug}>"

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self.slug:
            self.slug = slugify_uniquely(self.name, self.__class__)

        super().save(*args, **kwargs)
