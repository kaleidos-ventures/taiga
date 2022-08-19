# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


from asgiref.sync import sync_to_async
from taiga.workflows import dataclasses as dt
from taiga.workflows import models


@sync_to_async
def get_project_workflows(project_slug: str) -> list[dt.Workflow]:
    wfs_qs = models.Workflow.objects.prefetch_related("statuses").filter(project__slug=project_slug).order_by("order")
    workflows = []
    for wf in wfs_qs:
        workflows.append(
            dt.Workflow(
                name=wf.name,
                slug=wf.slug,
                order=wf.order,
                statuses=[
                    dt.WorkflowStatus(name=status.name, slug=status.slug, order=status.order, color=status.color)
                    for status in wf.statuses.all()
                ],
            )
        )
    return workflows
