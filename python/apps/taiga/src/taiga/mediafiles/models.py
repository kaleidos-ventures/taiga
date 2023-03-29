# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from os import path

from taiga.base.db import models
from taiga.base.db.mixins import CreatedMetaInfoMixin
from taiga.base.utils.files import get_obfuscated_file_path


def get_mediafile_file_path(instance: "Mediafile", filename: str) -> str:
    base_path = path.join("mediafiles", "proj", instance.project.b64id)
    return get_obfuscated_file_path(instance, filename, base_path)


class Mediafile(models.BaseModel, CreatedMetaInfoMixin):
    # TODO: We need to remove file on delete project and content_object. It may depend on the real life that
    #       the files have beyond their content object (especially with history or activity timelines).
    #       (Some inspiration https://github.com/un1t/django-cleanup)
    file = models.FileField(
        upload_to=get_mediafile_file_path,
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
    project = models.ForeignKey(
        "projects.Project",
        null=False,
        blank=False,
        related_name="mediafiles",
        on_delete=models.CASCADE,
        verbose_name="project",
    )

    object_content_type = models.ForeignKey(
        "contenttypes.ContentType",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        verbose_name="object content type",
    )
    object_id = models.UUIDField(null=True, blank=True, verbose_name="object id")
    content_object = models.GenericForeignKey(
        "object_content_type",
        "object_id",
    )

    class Meta:
        verbose_name = "mediafile"
        verbose_name_plural = "mediafiles"
        indexes = [
            models.Index(fields=["object_content_type", "object_id"]),
            models.Index(fields=["project"]),
        ]

    def __str__(self) -> str:
        return self.name

    def __repr__(self) -> str:
        return f"<Mediafile {self.name}>"
