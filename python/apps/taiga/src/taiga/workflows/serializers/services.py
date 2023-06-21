# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from taiga.workflows.models import Workflow, WorkflowStatus
from taiga.workflows.serializers import WorkflowSerializer, WorkflowStatusSerializer


def serialize_workflow(workflow: Workflow, workflow_statuses: list[WorkflowStatus] = []) -> WorkflowSerializer:
    return WorkflowSerializer(
        id=workflow.id,
        name=workflow.name,
        slug=workflow.slug,
        order=workflow.order,
        statuses=workflow_statuses,
    )


def serialize_workflow_status(workflow_status: WorkflowStatus, workflow: Workflow) -> WorkflowStatusSerializer:
    return WorkflowStatusSerializer(
        id=workflow_status.id,
        name=workflow_status.name,
        slug=workflow_status.slug,
        color=workflow_status.color,
        order=workflow_status.order,
        workflow=workflow,
    )
