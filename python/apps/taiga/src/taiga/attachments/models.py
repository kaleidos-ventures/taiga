# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from taiga.base.db import models
from taiga.base.db.mixins import CreatedMetaInfoMixin


class Attachment(models.BaseModel, CreatedMetaInfoMixin):
    storaged_object = models.ForeignKey(
        "storage.StoragedObject",
        null=False,
        blank=False,
        on_delete=models.RESTRICT,
        related_name="attachments",
        verbose_name="storaged object",
    )
    name = models.TextField(
        null=False,
        blank=False,
        verbose_name="file name",
    )
    content_type = models.TextField(
        null=False,
        blank=False,
        verbose_name="file content type",
    )
    size = models.IntegerField(
        null=False,
        blank=False,
        verbose_name="file size (bytes)",
    )

    object_content_type = models.ForeignKey(
        "contenttypes.ContentType",
        null=False,
        blank=False,
        on_delete=models.CASCADE,
        verbose_name="object content type",
    )
    object_id = models.UUIDField(null=False, blank=False, verbose_name="object id")
    # NOTE: the content_object should have a project attribute.
    content_object = models.GenericForeignKey(
        "object_content_type",
        "object_id",
    )

    class Meta:
        verbose_name = "attachment"
        verbose_name_plural = "attachments"
        indexes = [
            models.Index(fields=["object_content_type", "object_id"]),
        ]
        ordering = ["object_content_type", "object_id", "-created_at"]

    def __str__(self) -> str:
        return self.name

    def __repr__(self) -> str:
        return f"<Attachment {self.name}>"
