# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Literal, TypedDict
from uuid import UUID

from asgiref.sync import sync_to_async
from taiga.base.db.models import QuerySet
from taiga.projects.projects.models import Project
from taiga.workflows.models import Workflow, WorkflowStatus
from taiga.workflows.schemas import WorkflowSchema, WorkflowStatusSchema

##########################################################
# Workflow - filters and querysets
##########################################################

DEFAULT_QUERYSET_WORKFLOW = Workflow.objects.all()


class WorkflowFilters(TypedDict, total=False):
    slug: str
    project_id: UUID


def _apply_filters_to_workflow_queryset(
    qs: QuerySet[Workflow],
    filters: WorkflowFilters = {},
) -> QuerySet[Workflow]:
    return qs.filter(**filters)


WorkflowPrefetchRelated = list[
    Literal[
        "statuses",
    ]
]


def _apply_prefetch_related_to_workflow_queryset(
    qs: QuerySet[Workflow],
    prefetch_related: WorkflowPrefetchRelated,
) -> QuerySet[Workflow]:
    return qs.prefetch_related(*prefetch_related)


WorkflowOrderBy = list[
    Literal[
        "order",
    ]
]


def _apply_order_by_to_workflow_queryset(
    qs: QuerySet[Workflow],
    order_by: WorkflowOrderBy,
) -> QuerySet[Workflow]:
    return qs.order_by(*order_by)


##########################################################
# Workflow - create workflow
##########################################################


def create_workflow_sync(
    name: str,
    slug: str,
    order: int,
    project: Project,
) -> Workflow:

    return Workflow.objects.create(
        name=name,
        slug=slug,
        order=order,
        project=project,
    )


create_workflow = sync_to_async(create_workflow_sync)


##########################################################
# Workflow - get workflows
##########################################################


@sync_to_async
def get_workflows(
    filters: WorkflowFilters = {},
    prefetch_related: WorkflowPrefetchRelated = ["statuses"],
    order_by: WorkflowOrderBy = ["order"],
) -> list[WorkflowSchema] | None:
    qs = _apply_filters_to_workflow_queryset(qs=DEFAULT_QUERYSET_WORKFLOW, filters=filters)
    qs = _apply_prefetch_related_to_workflow_queryset(qs=qs, prefetch_related=prefetch_related)
    qs = _apply_order_by_to_workflow_queryset(order_by=order_by, qs=qs)

    dt_workflows = []
    for workflow in qs:
        dt_workflows.append(get_workflow_dt(workflow))
    return dt_workflows


##########################################################
# Workflow - get workflow
##########################################################


@sync_to_async
def get_workflow(
    filters: WorkflowFilters = {},
    prefetch_related: WorkflowPrefetchRelated = ["statuses"],
) -> WorkflowSchema | None:
    qs = _apply_filters_to_workflow_queryset(qs=DEFAULT_QUERYSET_WORKFLOW, filters=filters)
    qs = _apply_prefetch_related_to_workflow_queryset(qs=qs, prefetch_related=prefetch_related)

    try:
        return get_workflow_dt(qs.get())
    except Workflow.DoesNotExist:
        return None


##########################################################
# Workflow - misc
##########################################################


def get_workflow_dt(workflow: Workflow) -> WorkflowSchema:
    return WorkflowSchema(
        id=workflow.id,
        name=workflow.name,
        slug=workflow.slug,
        order=workflow.order,
        statuses=[get_workflow_status_dt(status) for status in workflow.statuses.all()],
    )


##########################################################
# WorkflowStatus - filters and querysets
##########################################################

DEFAULT_QUERYSET_WORKFLOW_STATUS = WorkflowStatus.objects.all()


class WorkflowStatusFilters(TypedDict, total=False):
    slug: str
    workflow_id: UUID
    workflow_slug: str
    project_id: UUID


def _apply_filters_to_workflow_status_queryset(
    qs: QuerySet[WorkflowStatus],
    filters: WorkflowStatusFilters = {},
) -> QuerySet[WorkflowStatus]:
    filter_data = dict(filters.copy())

    if "workflow_slug" in filter_data:
        filter_data["workflow__slug"] = filter_data.pop("workflow_slug")

    if "project_id" in filter_data:
        filter_data["workflow__project_id"] = filter_data.pop("project_id")

    return qs.filter(**filter_data)


##########################################################
# WorkflowStatus - create workflow status
##########################################################


def create_workflow_status_sync(
    name: str,
    slug: str,
    color: int,
    order: int,
    workflow: Workflow,
) -> WorkflowStatus:

    return WorkflowStatus.objects.create(
        name=name,
        slug=slug,
        color=color,
        order=order,
        workflow=workflow,
    )


create_workflow_status = sync_to_async(create_workflow_status_sync)


##########################################################
# WorkflowStatus - get workflow status
##########################################################


@sync_to_async
def get_status(filters: WorkflowStatusFilters = {}) -> WorkflowStatus | None:
    qs = _apply_filters_to_workflow_status_queryset(qs=DEFAULT_QUERYSET_WORKFLOW_STATUS, filters=filters)

    try:
        return qs.get()
    except WorkflowStatus.DoesNotExist:
        return None


##########################################################
# WorkflowStatus - misc
##########################################################


def get_workflow_status_dt(ws: WorkflowStatus) -> WorkflowStatusSchema:
    return WorkflowStatusSchema(id=ws.id, name=ws.name, slug=ws.slug, order=ws.order, color=ws.color)
