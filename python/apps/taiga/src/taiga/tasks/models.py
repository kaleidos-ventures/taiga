# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.base.db import models
from taiga.base.db.mixins import CreatedMetaInfoMixin
from taiga.base.utils.datetime import timestamp_mics


class Task(models.BaseModel, CreatedMetaInfoMixin):
    name = models.CharField(max_length=500, null=False, blank=False, verbose_name="name")
    order = models.BigIntegerField(default=timestamp_mics, null=False, blank=False, verbose_name="order")
    reference = models.BigIntegerField(null=True, blank=True, default=timestamp_mics, verbose_name="reference")
    project = models.ForeignKey(
        "projects.Project",
        null=False,
        blank=False,
        related_name="tasks",
        on_delete=models.CASCADE,
        verbose_name="project",
    )
    workflow = models.ForeignKey(
        "workflows.Workflow",
        null=False,
        blank=False,
        related_name="tasks",
        on_delete=models.CASCADE,
        verbose_name="workflow",
    )
    status = models.ForeignKey(
        "workflows.WorkflowStatus",
        null=False,
        blank=False,
        related_name="tasks",
        on_delete=models.CASCADE,
        verbose_name="status",
    )

    class Meta:
        verbose_name = "task"
        verbose_name_plural = "tasks"
        unique_together = (
            "reference",
            "project",
        )
        ordering = ["project", "workflow", "status", "order"]

    def __str__(self) -> str:
        return self.name

    def __repr__(self) -> str:
        return f"<Task {self.name}>"
