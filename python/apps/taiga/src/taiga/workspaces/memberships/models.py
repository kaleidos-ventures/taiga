# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from taiga.base.db import models
from taiga.base.db.mixins import CreatedAtMetaInfoMixin


class WorkspaceMembership(models.BaseModel, CreatedAtMetaInfoMixin):
    user = models.ForeignKey(
        "users.User",
        null=False,
        blank=False,
        related_name="workspace_memberships",
        on_delete=models.CASCADE,
        verbose_name="user",
    )
    workspace = models.ForeignKey(
        "workspaces.Workspace",
        null=False,
        blank=False,
        related_name="memberships",
        on_delete=models.CASCADE,
        verbose_name="workspace",
    )

    class Meta:
        verbose_name = "workspace membership"
        verbose_name_plural = "workspace memberships"
        constraints = [
            models.UniqueConstraint(fields=["workspace", "user"], name="%(app_label)s_%(class)s_unique_workspace_user"),
        ]
        indexes = [
            models.Index(fields=["workspace", "user"]),
        ]
        ordering = ["workspace", "user"]

    def __str__(self) -> str:
        return f"{self.workspace} - {self.user}"

    def __repr__(self) -> str:
        return f"<WorkspaceMembership {self.workspace} {self.user}>"
