# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


from uuid import UUID

from taiga.workflows import repositories as workflows_repositories
from taiga.workflows.models import Workflow
from taiga.workflows.schemas import WorkflowSchema

##########################################################
# list workflows
##########################################################


async def list_workflows_schemas(project_id: UUID) -> list[WorkflowSchema]:
    return await workflows_repositories.list_workflows_schemas(
        filters={
            "project_id": project_id,
        },
        prefetch_related=["statuses"],
    )


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


async def get_workflow_schema(project_id: UUID, workflow_slug: str) -> WorkflowSchema | None:
    return await workflows_repositories.get_workflow_schema(
        filters={
            "project_id": project_id,
            "slug": workflow_slug,
        },
        prefetch_related=["statuses"],
    )
