# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.db import models
from taiga.base.db.mixins import CreatedAtMetaInfoMixin, DeletedAtMetaInfoMixin
from taiga.base.utils.files import get_obfuscated_file_path


def get_storaged_object_file_patch(instance: "StoragedObject", filename: str) -> str:
    return get_obfuscated_file_path(instance, filename, "storagedobjets")


class StoragedObject(models.BaseModel, CreatedAtMetaInfoMixin, DeletedAtMetaInfoMixin):
    file = models.FileField(
        upload_to=get_storaged_object_file_patch,
        max_length=500,
        null=False,
        blank=False,
        verbose_name="file",
    )

    class Meta:
        verbose_name = "storaged_objects"
        verbose_name_plural = "storaged_objects"
        indexes = [
            models.Index(models.TruncDate("created_at"), "created_at", name="created_at_date_idx"),
            models.Index(models.TruncDate("deleted_at"), "deleted_at", name="deleted_at_date_idx"),
        ]
        ordering = [
            "-created_at",
        ]

    def __str__(self) -> str:
        return self.file.name

    def __repr__(self) -> str:
        return f"<StoragedObject {self.file.name}>"
