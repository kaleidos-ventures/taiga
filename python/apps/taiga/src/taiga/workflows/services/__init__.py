# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from decimal import Decimal
from typing import Any, cast
from uuid import UUID

from taiga.workflows import events as workflows_events
from taiga.workflows import repositories as workflows_repositories
from taiga.workflows.models import Workflow, WorkflowStatus
from taiga.workflows.serializers import WorkflowSerializer
from taiga.workflows.serializers import services as serializers_services
from taiga.workflows.services import exceptions as ex

DEFAULT_ORDER_OFFSET = Decimal(100)  # default offset when adding a workflow status


##########################################################
# list workflows
##########################################################


async def list_workflows(project_id: UUID) -> list[WorkflowSerializer]:
    workflows = await workflows_repositories.list_workflows(
        filters={
            "project_id": project_id,
        },
        prefetch_related=["statuses"],
    )

    return [
        serializers_services.serialize_workflow(
            workflow=workflow,
            workflow_statuses=await workflows_repositories.list_workflow_statuses(filters={"workflow_id": workflow.id}),
        )
        for workflow in workflows
    ]


##########################################################
# get workflow
##########################################################


async def get_workflow(project_id: UUID, workflow_slug: str) -> Workflow | None:
    return await workflows_repositories.get_workflow(
        filters={
            "project_id": project_id,
            "slug": workflow_slug,
        },
        select_related=["project"],
    )


async def get_workflow_detail(project_id: UUID, workflow_slug: str) -> WorkflowSerializer:
    workflow = cast(
        Workflow,
        await workflows_repositories.get_workflow(
            filters={
                "project_id": project_id,
                "slug": workflow_slug,
            },
            select_related=["project"],
        ),
    )
    workflow_statuses = await workflows_repositories.list_workflow_statuses(filters={"workflow_id": workflow.id})
    return serializers_services.serialize_workflow(workflow=workflow, workflow_statuses=workflow_statuses)


##########################################################
# create workflow status
##########################################################


async def create_workflow_status(name: str, color: int, workflow: Workflow) -> WorkflowStatus:
    latest_status = await workflows_repositories.list_workflow_statuses(
        filters={"workflow_id": workflow.id}, order_by=["-order"], offset=0, limit=1
    )
    order = DEFAULT_ORDER_OFFSET + (latest_status[0].order if latest_status else 0)

    # Create workflow status
    workflow_status = await workflows_repositories.create_workflow_status(
        name=name, slug=None, color=color, order=order, workflow=workflow
    )

    # Emit event
    await workflows_events.emit_event_when_workflow_status_is_created(
        project=workflow.project, workflow_status=workflow_status
    )

    return workflow_status


##########################################################
# get workflow status
##########################################################


async def get_status(workflow_id: UUID, status_slug: str) -> WorkflowStatus | None:
    return await workflows_repositories.get_status(
        filters={
            "workflow_id": workflow_id,
            "slug": status_slug,
        },
        select_related=["workflow"],
    )


##########################################################
# update workflow status
##########################################################


async def update_workflow_status(
    workflow: Workflow, workflow_status: WorkflowStatus, values: dict[str, Any] = {}
) -> WorkflowStatus:
    if not values:
        return workflow_status

    if "name" in values and values["name"] is None:
        raise ex.TaigaValidationError("Name cannot be null")

    updated_status = await workflows_repositories.update_workflow_status(workflow_status=workflow_status, values=values)

    await workflows_events.emit_event_when_workflow_status_is_updated(
        project=workflow.project, workflow_status=updated_status
    )

    return updated_status
