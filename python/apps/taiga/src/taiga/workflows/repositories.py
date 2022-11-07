# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


from asgiref.sync import sync_to_async
from taiga.workflows import models
from taiga.workflows.models import Workflow, WorkflowStatus
from taiga.workflows.schemas import WorkflowSchema, WorkflowStatusSchema


@sync_to_async
def get_project_workflows(project_slug: str) -> list[WorkflowSchema]:
    project_workflows = (
        models.Workflow.objects.prefetch_related("statuses").filter(project__slug=project_slug).order_by("order")
    )
    dt_workflows = []
    for workflow in project_workflows:
        dt_workflows.append(_get_workflow_dt(workflow))
    return dt_workflows


@sync_to_async
def get_project_workflow(project_slug: str, workflow_slug: str) -> WorkflowSchema | None:
    try:
        workflow = Workflow.objects.prefetch_related("statuses").get(slug=workflow_slug, project__slug=project_slug)
        return _get_workflow_dt(workflow)
    except Workflow.DoesNotExist:
        return None


@sync_to_async
def get_status(project_slug: str, workflow_slug: str, status_slug: str) -> WorkflowStatus | None:
    try:
        return WorkflowStatus.objects.get(
            slug=status_slug, workflow__slug=workflow_slug, workflow__project__slug=project_slug
        )
    except WorkflowStatus.DoesNotExist:
        return None


def _get_workflow_dt(workflow: Workflow) -> WorkflowSchema:
    return WorkflowSchema(
        id=workflow.id,
        name=workflow.name,
        slug=workflow.slug,
        order=workflow.order,
        statuses=[
            WorkflowStatusSchema(
                id=status.id, name=status.name, slug=status.slug, order=status.order, color=status.color
            )
            for status in workflow.statuses.all()
        ],
    )
