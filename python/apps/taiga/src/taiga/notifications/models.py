# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.db import models
from taiga.base.db.mixins import CreatedMetaInfoMixin

#######################################################################
# Base Notification
######################################################################


class Notification(models.BaseModel, CreatedMetaInfoMixin):
    type = models.CharField(
        max_length=500,
        null=False,
        blank=False,
        verbose_name="type",
    )
    owner = models.ForeignKey(
        "users.User",
        null=False,
        blank=False,
        on_delete=models.CASCADE,
        related_name="notifications",
        verbose_name="owner",
    )
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="read at",
    )
    content = models.JSONField(
        null=False,
        blank=False,
        default=dict,
        verbose_name="content",
    )

    class Meta:
        verbose_name = "notification"
        verbose_name_plural = "notifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=[
                    "owner",
                ]
            ),
            models.Index(fields=["owner", "read_at"]),
        ]
