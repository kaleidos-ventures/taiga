# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any

from taiga.base.db import models
from taiga.projects.references import get_new_project_reference_id


class ProjectReferenceMixin(models.Model):
    ref = models.BigIntegerField(db_index=True, null=False, blank=False, default=0, verbose_name="ref")

    class Meta:
        abstract = True
        constraints = [models.UniqueConstraint(fields=["project", "ref"], name="projects_unique_refs")]
        indexes = [
            models.Index(fields=["project", "ref"]),
        ]

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self.ref:
            self.ref = get_new_project_reference_id(project_id=self.project_id)  # type: ignore[attr-defined]

        super().save(*args, **kwargs)
