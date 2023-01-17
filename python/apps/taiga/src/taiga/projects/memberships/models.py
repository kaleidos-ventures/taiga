# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


from taiga.base.db import models
from taiga.base.db.mixins import CreatedAtMetaInfoMixin


class ProjectMembership(models.BaseModel, CreatedAtMetaInfoMixin):
    user = models.ForeignKey(
        "users.User",
        null=False,
        blank=False,
        related_name="project_memberships",
        on_delete=models.CASCADE,
        verbose_name="user",
    )
    project = models.ForeignKey(
        "projects.Project",
        null=False,
        blank=False,
        related_name="memberships",
        on_delete=models.CASCADE,
        verbose_name="project",
    )
    role = models.ForeignKey(
        "projects_roles.ProjectRole",
        null=False,
        blank=False,
        related_name="memberships",
        on_delete=models.CASCADE,
        verbose_name="role",
    )

    class Meta:
        verbose_name = "project membership"
        verbose_name_plural = "project memberships"
        constraints = [
            models.UniqueConstraint(fields=["project", "user"], name="%(app_label)s_%(class)s_unique_project_user"),
        ]
        indexes = [
            models.Index(fields=["project", "user"]),
        ]
        ordering = ["project", "user"]

    def __str__(self) -> str:
        return f"{self.project} - {self.user}"

    def __repr__(self) -> str:
        return f"<ProjectMembership {self.project} {self.user}>"
