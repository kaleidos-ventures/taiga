# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Literal, TypedDict

from asgiref.sync import sync_to_async
from taiga.base.db.models import QuerySet
from taiga.workflows.models import Workflow, WorkflowStatus
from taiga.workflows.schemas import WorkflowSchema, WorkflowStatusSchema

##########################################################
# filters and querysets
##########################################################

DEFAULT_QUERYSET_WORKFLOW = Workflow.objects.all()
DEFAULT_QUERYSET_WORKFLOW_STATUS = WorkflowStatus.objects.all()


class WorkflowListFilters(TypedDict, total=False):
    project_slug: str


def _apply_filters_to_queryset_list_workflow(
    qs: QuerySet[Workflow],
    filters: WorkflowListFilters = {},
) -> QuerySet[Workflow]:
    filter_data = dict(filters.copy())

    if "project_slug" in filter_data:
        filter_data["project__slug"] = filter_data.pop("project_slug")

    qs = qs.filter(**filter_data)
    return qs


class WorkflowFilters(TypedDict, total=False):
    slug: str
    project_slug: str


def _apply_filters_to_queryset_workflow(
    qs: QuerySet[Workflow],
    filters: WorkflowFilters = {},
) -> QuerySet[Workflow]:
    filter_data = dict(filters.copy())

    if "project_slug" in filter_data:
        filter_data["project__slug"] = filter_data.pop("project_slug")

    qs = qs.filter(**filter_data)
    return qs


WorkflowPrefetchRelated = list[
    Literal[
        "statuses",
    ]
]


def _apply_prefetch_related_to_queryset_workflow(
    qs: QuerySet[Workflow],
    prefetch_related: WorkflowPrefetchRelated,
) -> QuerySet[Workflow]:
    prefetch_related_data = []

    for key in prefetch_related:
        prefetch_related_data.append(key)

    qs = qs.prefetch_related(*prefetch_related_data)
    return qs


WorkflowOrderBy = list[
    Literal[
        "order",
    ]
]


def _apply_order_by_to_queryset_workflow(
    qs: QuerySet[Workflow],
    order_by: WorkflowOrderBy,
) -> QuerySet[Workflow]:
    order_by_data = []

    for key in order_by:
        order_by_data.append(key)

    qs = qs.order_by(*order_by_data)
    return qs


class WorkflowStatusFilters(TypedDict, total=False):
    slug: str
    workflow_slug: str
    project_slug: str


def _apply_filters_to_queryset_workflow_status(
    qs: QuerySet[WorkflowStatus],
    filters: WorkflowStatusFilters = {},
) -> QuerySet[WorkflowStatus]:
    filter_data = dict(filters.copy())

    if "workflow_slug" in filter_data:
        filter_data["workflow__slug"] = filter_data.pop("workflow_slug")

    if "project_slug" in filter_data:
        filter_data["workflow__project__slug"] = filter_data.pop("project_slug")

    qs = qs.filter(**filter_data)
    return qs


##########################################################
# get project workflows
##########################################################


@sync_to_async
def get_project_workflows(
    filters: WorkflowListFilters = {},
    prefetch_related: WorkflowPrefetchRelated = ["statuses"],
    order_by: WorkflowOrderBy = ["order"],
) -> list[WorkflowSchema] | None:
    qs = _apply_filters_to_queryset_list_workflow(qs=DEFAULT_QUERYSET_WORKFLOW, filters=filters)
    qs = _apply_prefetch_related_to_queryset_workflow(qs=qs, prefetch_related=prefetch_related)
    qs = _apply_order_by_to_queryset_workflow(order_by=order_by, qs=qs)

    dt_workflows = []
    for workflow in qs:
        dt_workflows.append(_get_workflow_dt(workflow))
    return dt_workflows


##########################################################
# get project workflow
##########################################################


@sync_to_async
def get_project_workflow(
    filters: WorkflowFilters = {},
    prefetch_related: WorkflowPrefetchRelated = ["statuses"],
) -> WorkflowSchema | None:
    qs = _apply_filters_to_queryset_workflow(qs=DEFAULT_QUERYSET_WORKFLOW, filters=filters)
    qs = _apply_prefetch_related_to_queryset_workflow(qs=qs, prefetch_related=prefetch_related)

    try:
        return _get_workflow_dt(qs.get())
    except Workflow.DoesNotExist:
        return None


##########################################################
# get status
##########################################################


@sync_to_async
def get_status(filters: WorkflowStatusFilters = {}) -> WorkflowStatus | None:
    qs = _apply_filters_to_queryset_workflow_status(qs=DEFAULT_QUERYSET_WORKFLOW_STATUS, filters=filters)

    try:
        return qs.get()
    except WorkflowStatus.DoesNotExist:
        return None


##########################################################
# utils
##########################################################


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
