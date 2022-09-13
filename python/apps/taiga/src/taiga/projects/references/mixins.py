# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any, Protocol
from uuid import UUID

from taiga.base.db import models
from taiga.projects.references import get_new_project_reference_id


class ReferencedModel(Protocol):
    project_id: UUID


# TODO: Should be this:
#
# class ProjectReferenceMixin(models.Model, ReferencedModel, metaclass=models.ModelProtocol):
#
class ProjectReferenceMixin(models.Model):
    ref = models.BigIntegerField(db_index=True, null=False, blank=False, default=0, verbose_name="ref")

    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=["project", "ref"]),
        ]

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self.ref:
            self.ref = get_new_project_reference_id(project_id=self.project_id)  # type: ignore[attr-defined]

        super().save(*args, **kwargs)
