# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any

from taiga.base.db import models
from taiga.base.utils.datetime import timestamp_mics
from taiga.base.utils.slug import generate_incremental_int_suffix, slugify_uniquely_for_queryset


class Workflow(models.BaseModel):
    name = models.CharField(max_length=250, null=False, blank=False, verbose_name="name")
    slug = models.LowerSlugField(max_length=250, null=False, blank=False, verbose_name="slug")
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
        constraints = [
            models.UniqueConstraint(fields=["project", "slug"], name="%(app_label)s_%(class)s_unique_project_slug"),
            models.UniqueConstraint(fields=["project", "name"], name="%(app_label)s_%(class)s_unique_project_name"),
        ]
        indexes = [
            models.Index(fields=["project", "slug"]),
        ]
        ordering = ["project", "order", "name"]

    def __str__(self) -> str:
        return self.name

    def __repr__(self) -> str:
        return f"<Workflow {self.name}>"


class WorkflowStatus(models.BaseModel):
    name = models.CharField(max_length=30, null=False, blank=False, verbose_name="name")
    slug = models.LowerSlugField(max_length=250, null=False, blank=False, verbose_name="slug")
    color = models.IntegerField(null=False, blank=False, default=1, verbose_name="color")
    order = models.DecimalField(
        max_digits=16, decimal_places=10, default=100, null=False, blank=False, verbose_name="order"
    )
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
        constraints = [
            models.UniqueConstraint(fields=["workflow", "slug"], name="%(app_label)s_%(class)s_unique_workflow_slug"),
        ]
        indexes = [
            models.Index(fields=["workflow", "slug"]),
        ]
        ordering = ["workflow", "order", "name"]

    def __str__(self) -> str:
        return self.name

    def __repr__(self) -> str:
        return f"<WorkflowStatus {self.name}>"

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self.slug:
            self.slug = slugify_uniquely_for_queryset(
                value=self.name,
                queryset=self.workflow.statuses.all(),
                generate_suffix=generate_incremental_int_suffix(),
                use_always_suffix=False,
            )

        super().save(*args, **kwargs)
