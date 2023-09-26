# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from typing import Any
from uuid import UUID

from taiga.stories.stories.serializers import StorySummarySerializer
from taiga.workflows.models import Workflow, WorkflowStatus
from taiga.workflows.serializers import DeleteWorkflowSerializer, ReorderWorkflowStatusesSerializer, WorkflowSerializer


def serialize_workflow(workflow: Workflow, workflow_statuses: list[WorkflowStatus] = []) -> WorkflowSerializer:
    return WorkflowSerializer(
        id=workflow.id,
        name=workflow.name,
        slug=workflow.slug,
        order=workflow.order,
        statuses=workflow_statuses,
    )


def serialize_delete_workflow_detail(
    workflow: Workflow,
    workflow_statuses: list[WorkflowStatus] = [],
    workflow_stories: list[StorySummarySerializer] = [],
) -> DeleteWorkflowSerializer:
    return DeleteWorkflowSerializer(
        id=workflow.id,
        name=workflow.name,
        slug=workflow.slug,
        order=workflow.order,
        statuses=workflow_statuses,
        stories=workflow_stories,
    )


def serialize_reorder_workflow_statuses(
    workflow: Workflow, statuses: list[UUID], reorder: dict[str, Any] | None = None
) -> ReorderWorkflowStatusesSerializer:
    return ReorderWorkflowStatusesSerializer(workflow=workflow, statuses=statuses, reorder=reorder)
