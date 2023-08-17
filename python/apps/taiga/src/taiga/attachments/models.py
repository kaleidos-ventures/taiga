# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from os import path
from typing import cast

from taiga.base.db import models
from taiga.base.db.mixins import CreatedMetaInfoMixin
from taiga.base.utils.files import get_obfuscated_file_path


def get_attachment_file_path(instance: "Attachment", filename: str) -> str:
    content_object = cast(models.BaseModel, instance.content_object)
    base_path = path.join(
        "attachments",
        f"{content_object._meta.app_label}_{content_object._meta.model_name}",
        content_object.b64id,
    )
    return get_obfuscated_file_path(instance, filename, base_path)


class Attachment(models.BaseModel, CreatedMetaInfoMixin):
    # TODO: We need to remove file on delete content_object. It may depend on the real life that
    #       the files have beyond their content object (especially with history or activity timelines).
    #       (Some inspiration https://github.com/un1t/django-cleanup)
    file = models.FileField(
        upload_to=get_attachment_file_path,
        max_length=500,
        null=False,
        blank=False,
        verbose_name="file",
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
