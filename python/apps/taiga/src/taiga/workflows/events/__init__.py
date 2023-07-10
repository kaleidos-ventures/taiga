# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.events import events_manager
from taiga.projects.projects.models import Project
from taiga.workflows.events.content import (
    CreateWorkflowStatusContent,
    DeleteWorkflowStatusContent,
    ReorderWorkflowStatusesContent,
    UpdateWorkflowStatusContent,
)
from taiga.workflows.models import WorkflowStatus
from taiga.workflows.serializers import ReorderWorkflowStatusesSerializer

CREATE_WORKFLOW_STATUS = "workflowstatuses.create"
UPDATE_WORKFLOW_STATUS = "workflowstatuses.update"
REORDER_WORKFLOW_STATUS = "workflowstatuses.reorder"
DELETE_WORKFLOW_STATUS = "workflowstatuses.delete"


async def emit_event_when_workflow_status_is_created(project: Project, workflow_status: WorkflowStatus) -> None:
    await events_manager.publish_on_project_channel(
        project=project,
        type=CREATE_WORKFLOW_STATUS,
        content=CreateWorkflowStatusContent(workflow_status=workflow_status),
    )


async def emit_event_when_workflow_status_is_updated(project: Project, workflow_status: WorkflowStatus) -> None:
    await events_manager.publish_on_project_channel(
        project=project,
        type=UPDATE_WORKFLOW_STATUS,
        content=UpdateWorkflowStatusContent(workflow_status=workflow_status),
    )


async def emit_event_when_workflow_statuses_are_reordered(
    project: Project, reorder: ReorderWorkflowStatusesSerializer
) -> None:
    await events_manager.publish_on_project_channel(
        project=project,
        type=REORDER_WORKFLOW_STATUS,
        content=ReorderWorkflowStatusesContent(reorder=reorder),
    )


async def emit_event_when_workflow_status_is_deleted(
    project: Project, workflow_status: WorkflowStatus, target_status: WorkflowStatus | None
) -> None:
    await events_manager.publish_on_project_channel(
        project=project,
        type=DELETE_WORKFLOW_STATUS,
        content=DeleteWorkflowStatusContent(
            workflow_status=workflow_status,
            target_status=target_status,
        ),
    )
