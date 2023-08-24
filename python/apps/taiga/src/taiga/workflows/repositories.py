# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from decimal import Decimal
from typing import Any, Literal, TypedDict
from uuid import UUID

from asgiref.sync import sync_to_async
from taiga.base.db.models import QuerySet
from taiga.base.repositories import neighbors as neighbors_repositories
from taiga.base.repositories.neighbors import Neighbor
from taiga.projects.projects.models import Project
from taiga.workflows.models import Workflow, WorkflowStatus

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


WorkflowSelectRelated = list[Literal["project", "workspace"]]


def _apply_select_related_to_workflow_queryset(
    qs: QuerySet[Workflow],
    select_related: WorkflowSelectRelated,
) -> QuerySet[Workflow]:
    select_related_data = []

    for key in select_related:
        if key == "workspace":
            select_related_data.append("project__workspace")
        else:
            select_related_data.append(key)

    return qs.select_related(*select_related_data)


WorkflowPrefetchRelated = list[Literal["statuses",]]


def _apply_prefetch_related_to_workflow_queryset(
    qs: QuerySet[Workflow],
    prefetch_related: WorkflowPrefetchRelated,
) -> QuerySet[Workflow]:
    return qs.prefetch_related(*prefetch_related)


WorkflowOrderBy = list[Literal["order",]]


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
# Workflow - list workflows
##########################################################


@sync_to_async
def list_workflows(
    filters: WorkflowFilters = {},
    prefetch_related: WorkflowPrefetchRelated = ["statuses"],
    order_by: WorkflowOrderBy = ["order"],
) -> list[Workflow]:
    qs = _apply_filters_to_workflow_queryset(qs=DEFAULT_QUERYSET_WORKFLOW, filters=filters)
    qs = _apply_prefetch_related_to_workflow_queryset(qs=qs, prefetch_related=prefetch_related)
    qs = _apply_order_by_to_workflow_queryset(order_by=order_by, qs=qs)

    return list(qs)


##########################################################
# Workflow - get workflow
##########################################################


@sync_to_async
def get_workflow(
    filters: WorkflowFilters = {},
    select_related: WorkflowSelectRelated = [],
    prefetch_related: WorkflowPrefetchRelated = ["statuses"],
) -> Workflow | None:
    qs = _apply_filters_to_workflow_queryset(qs=DEFAULT_QUERYSET_WORKFLOW, filters=filters)
    qs = _apply_select_related_to_workflow_queryset(qs=qs, select_related=select_related)
    qs = _apply_prefetch_related_to_workflow_queryset(qs=qs, prefetch_related=prefetch_related)

    try:
        return qs.get()
    except Workflow.DoesNotExist:
        return None


##########################################################
# WorkflowStatus - filters and querysets
##########################################################

DEFAULT_QUERYSET_WORKFLOW_STATUS = WorkflowStatus.objects.all()


class WorkflowStatusFilters(TypedDict, total=False):
    id: UUID
    ids: list[UUID]
    workflow_id: UUID
    workflow_slug: str
    project_id: UUID


def _apply_filters_to_workflow_status_queryset(
    qs: QuerySet[WorkflowStatus],
    filters: WorkflowStatusFilters = {},
) -> QuerySet[WorkflowStatus]:
    filter_data = dict(filters.copy())

    if "ids" in filters:
        filter_data["id__in"] = filter_data.pop("ids")

    if "workflow_slug" in filter_data:
        filter_data["workflow__slug"] = filter_data.pop("workflow_slug")

    if "project_id" in filter_data:
        filter_data["workflow__project_id"] = filter_data.pop("project_id")

    return qs.filter(**filter_data)


WorkflowStatusSelectRelated = list[
    Literal[
        "workflow",
        "project",
        "workspace",
    ]
]


def _apply_select_related_to_workflow_status_queryset(
    qs: QuerySet[WorkflowStatus],
    select_related: WorkflowStatusSelectRelated,
) -> QuerySet[WorkflowStatus]:
    select_related_data = []

    for key in select_related:
        if key == "project":
            select_related_data.append("workflow__project")
        elif key == "workspace":
            select_related_data.append("workflow__project__workspace")
        else:
            select_related_data.append(key)

    return qs.select_related(*select_related_data)


WorkflowStatusOrderBy = list[
    Literal[
        "order",
        "-order",
    ]
]


def _apply_order_by_to_workflow_status_queryset(
    qs: QuerySet[WorkflowStatus], order_by: WorkflowStatusOrderBy
) -> QuerySet[WorkflowStatus]:
    return qs.order_by(*order_by)


##########################################################
# WorkflowStatus - create workflow status
##########################################################


def create_workflow_status_sync(
    name: str,
    color: int,
    order: Decimal,
    workflow: Workflow,
) -> WorkflowStatus:
    return WorkflowStatus.objects.create(
        name=name,
        color=color,
        order=order,
        workflow=workflow,
    )


create_workflow_status = sync_to_async(create_workflow_status_sync)


##########################################################
# WorkflowStatus - list workflow statuses
##########################################################


@sync_to_async
def list_workflow_statuses(
    filters: WorkflowStatusFilters = {},
    order_by: WorkflowStatusOrderBy = ["order"],
    offset: int | None = None,
    limit: int | None = None,
) -> list[WorkflowStatus]:
    qs = _apply_filters_to_workflow_status_queryset(qs=DEFAULT_QUERYSET_WORKFLOW_STATUS, filters=filters)
    qs = _apply_order_by_to_workflow_status_queryset(qs=qs, order_by=order_by)

    if limit is not None and offset is not None:
        limit += offset

    return list(qs[offset:limit])


@sync_to_async
def list_workflow_statuses_to_reorder(filters: WorkflowStatusFilters = {}) -> list[WorkflowStatus]:
    """
    This method is very similar to "list_workflow_statuses" except this has to keep
    the order of the input ids.
    """
    qs = _apply_filters_to_workflow_status_queryset(qs=DEFAULT_QUERYSET_WORKFLOW_STATUS, filters=filters)

    statuses = {s.id: s for s in qs}
    return [statuses[id] for id in filters["ids"] if statuses.get(id) is not None]


@sync_to_async
def list_workflow_status_neighbors(
    status: WorkflowStatus,
    filters: WorkflowStatusFilters = {},
) -> Neighbor[WorkflowStatus]:
    qs = _apply_filters_to_workflow_status_queryset(qs=DEFAULT_QUERYSET_WORKFLOW_STATUS, filters=filters)
    qs = _apply_order_by_to_workflow_status_queryset(qs=qs, order_by=["order"])

    return neighbors_repositories.get_neighbors_sync(obj=status, model_queryset=qs)


##########################################################
# WorkflowStatus - get workflow status
##########################################################


@sync_to_async
def get_workflow_status(
    filters: WorkflowStatusFilters = {},
    select_related: WorkflowStatusSelectRelated = [],
) -> WorkflowStatus | None:
    qs = _apply_filters_to_workflow_status_queryset(qs=DEFAULT_QUERYSET_WORKFLOW_STATUS, filters=filters)
    qs = _apply_select_related_to_workflow_status_queryset(qs=qs, select_related=select_related)

    try:
        return qs.get()
    except WorkflowStatus.DoesNotExist:
        return None


##########################################################
# WorkflowStatus - update workflow status
##########################################################


@sync_to_async
def update_workflow_status(workflow_status: WorkflowStatus, values: dict[str, Any] = {}) -> WorkflowStatus:
    for attr, value in values.items():
        setattr(workflow_status, attr, value)

    workflow_status.save()
    return workflow_status


async def bulk_update_workflow_statuses(objs_to_update: list[WorkflowStatus], fields_to_update: list[str]) -> None:
    await WorkflowStatus.objects.abulk_update(objs_to_update, fields_to_update)


##########################################################
# WorkflowStatus - delete workflow status
##########################################################


async def delete_workflow_status(filters: WorkflowStatusFilters = {}) -> int:
    qs = _apply_filters_to_workflow_status_queryset(qs=DEFAULT_QUERYSET_WORKFLOW_STATUS, filters=filters)
    count, _ = await qs.adelete()
    return count
