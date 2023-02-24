# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from typing import cast
from uuid import UUID

from taiga.workflows import repositories as workflows_repositories
from taiga.workflows.models import Workflow
from taiga.workflows.serializers import WorkflowSerializer
from taiga.workflows.serializers import services as serializers_services

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
            workflow_statuses=await workflows_repositories.list_workflow_statuses(workflow=workflow),
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
    return serializers_services.serialize_workflow(
        workflow=workflow, workflow_statuses=await workflows_repositories.list_workflow_statuses(workflow=workflow)
    )
