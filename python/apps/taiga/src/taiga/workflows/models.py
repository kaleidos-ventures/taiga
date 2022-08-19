# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.base.db import models
from taiga.base.utils.datetime import timestamp_mics


class Workflow(models.BaseModel):
    name = models.CharField(max_length=250, null=False, blank=False, verbose_name="name")
    slug = models.CharField(max_length=250, null=False, blank=False, verbose_name="slug")
    order = models.BigIntegerField(default=timestamp_mics, null=False, blank=False, verbose_name="order")
    project = models.ForeignKey(
        "projects.Project",
        null=False,
        blank=False,
        related_name="workflows",
        on_delete=models.CASCADE,
        verbose_name="project",
    )

    class Meta:
        verbose_name = "workflow"
        verbose_name_plural = "workflows"
        unique_together = (
            "slug",
            "project",
        )
        ordering = ["order", "name"]

    def __str__(self) -> str:
        return self.name

    def __repr__(self) -> str:
        return f"<Workflow {self.name}>"


class WorkflowStatus(models.BaseModel):
    name = models.CharField(max_length=250, null=False, blank=False, verbose_name="name")
    slug = models.CharField(max_length=250, null=False, blank=False, verbose_name="slug")
    color = models.IntegerField(null=False, blank=False, default=1, verbose_name="color")
    order = models.BigIntegerField(default=timestamp_mics, null=False, blank=False, verbose_name="order")
    workflow = models.ForeignKey(
        "workflows.Workflow",
        null=False,
        blank=False,
        related_name="statuses",
        on_delete=models.CASCADE,
        verbose_name="workflow",
    )

    class Meta:
        verbose_name = "workflow status"
        verbose_name_plural = "workflow statuses"
        unique_together = (
            "slug",
            "workflow",
        )
        ordering = ["order", "name"]

    def __str__(self) -> str:
        return self.name

    def __repr__(self) -> str:
        return f"<WorkflowStatus {self.workflow.name} - {self.name}>"
