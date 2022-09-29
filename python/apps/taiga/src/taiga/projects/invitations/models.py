# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.base.db import models
from taiga.projects.invitations.choices import ProjectInvitationStatus


class ProjectInvitation(models.BaseModel):
    project = models.ForeignKey(
        "projects.Project",
        null=False,
        blank=False,
        related_name="invitations",
        on_delete=models.CASCADE,
        verbose_name="project",
    )
    role = models.ForeignKey(
        "projects_roles.ProjectRole",
        null=False,
        blank=False,
        related_name="invitations",
        on_delete=models.CASCADE,
        verbose_name="role",
    )
    user = models.ForeignKey(
        "users.User",
        null=True,
        blank=True,
        default=None,
        related_name="project_invitations",
        on_delete=models.CASCADE,
        verbose_name="user",
    )
    email = models.LowerEmailField(max_length=255, null=False, blank=False, verbose_name="email")
    status = models.CharField(
        max_length=50,
        null=False,
        blank=False,
        choices=ProjectInvitationStatus.choices,
        default=ProjectInvitationStatus.PENDING,
        verbose_name="status",
    )
    created_at = models.DateTimeField(null=False, blank=False, auto_now_add=True, verbose_name="created at")

    invited_by = models.ForeignKey(
        "users.User",
        related_name="ihaveinvited+",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name="inviited by",
    )
    num_emails_sent = models.IntegerField(default=1, null=False, blank=False, verbose_name="num emails sent")
    resent_at = models.DateTimeField(null=True, blank=True, verbose_name="resent at")
    resent_by = models.ForeignKey(
        "users.User",
        related_name="ihaveresent+",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    revoked_by = models.ForeignKey(
        "users.User",
        related_name="ihaverevoked+",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    revoked_at = models.DateTimeField(null=True, blank=True, verbose_name="revoked at")

    class Meta:
        verbose_name = "project invitation"
        verbose_name_plural = "project invitations"
        constraints = [
            models.UniqueConstraint(fields=["project", "email"], name="%(app_label)s_%(class)s_unique_project_email")
        ]
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["project", "email"]),
            models.Index(fields=["project", "user"]),
        ]
        ordering = ["project", "user", "email"]

    def __str__(self) -> str:
        return f"{self.project} - {self.email}"

    def __repr__(self) -> str:
        return f"<ProjectInvitation {self.project} {self.email}>"
