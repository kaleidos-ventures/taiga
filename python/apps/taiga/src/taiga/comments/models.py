# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from taiga.base.db import models
from taiga.base.db.mixins import CreatedMetaInfoMixin, DeletedMetaInfoMixin, ModifiedAtMetaInfoMixin
from taiga.projects.projects.models import Project


class Comment(
    models.BaseModel,
    CreatedMetaInfoMixin,
    ModifiedAtMetaInfoMixin,
    DeletedMetaInfoMixin,
):
    text = models.TextField(null=False, blank=False, verbose_name="text")
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
        verbose_name = "comment"
        verbose_name_plural = "comments"
        indexes = [
            models.Index(fields=["object_content_type", "object_id"]),
        ]
        ordering = ["object_content_type", "object_id", "-created_at"]

    def __str__(self) -> str:
        return f'"{self.text}" (by {self.created_by} on {self.content_object})'

    def __repr__(self) -> str:
        return f"<Comment {self.id} [{self.content_object}]>"

    @property
    def project(self) -> Project:
        return getattr(self.content_object, "project")
