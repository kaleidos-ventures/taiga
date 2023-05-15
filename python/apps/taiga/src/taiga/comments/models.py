# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.db import models
from taiga.base.db.mixins import CreatedMetaInfoMixin, ModifiedAtMetaInfoMixin
from taiga.mediafiles.mixins import RelatedMediafilesMixin


class Comment(
    models.BaseModel,
    CreatedMetaInfoMixin,
    ModifiedAtMetaInfoMixin,
    RelatedMediafilesMixin,
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
        models.UniqueConstraint(
            fields=["content_type", "object_id"], name="%(app_label)s_%(class)s_unique_content_type-object_id"
        )
        ordering = ["object_content_type", "-created_at"]

    def __str__(self) -> str:
        return f"Comment to {self.object_content_type} #{self.object_id} (by {self.created_by}) {self.text}"

    def __repr__(self) -> str:
        return f"<Comment to #{self.object_id} #{self.text}>"
