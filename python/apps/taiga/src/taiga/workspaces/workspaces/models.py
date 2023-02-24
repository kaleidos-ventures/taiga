# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import functools

from slugify import slugify
from taiga.base.db import models
from taiga.base.db.mixins import CreatedAtMetaInfoMixin
from taiga.base.utils.uuid import encode_uuid_to_b64str


class Workspace(models.BaseModel, CreatedAtMetaInfoMixin):
    name = models.CharField(max_length=40, null=False, blank=False, verbose_name="name")
    color = models.IntegerField(null=False, blank=False, default=1, verbose_name="color")

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
        through="workspaces_memberships.WorkspaceMembership",
        through_fields=("workspace", "user"),
        verbose_name="members",
    )

    is_premium = models.BooleanField(null=False, blank=True, default=False, verbose_name="is premium")

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

    @functools.cached_property
    def b64id(self) -> str:
        return encode_uuid_to_b64str(self.id)
