# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from uuid import UUID

from fastapi import Query
from taiga.base.api import Request
from taiga.base.api.permissions import check_permissions
from taiga.base.validators import B64UUID
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_403, ERROR_404
from taiga.permissions import HasPerm
from taiga.projects.projects.api import get_project_or_404
from taiga.routers import routes
from taiga.workflows import services as workflows_services
from taiga.workflows.schemas import WorkflowSchema
from taiga.workflows.serializers import WorkflowSerializer

# PERMISSIONS
GET_PROJECT_WORKFLOWS = HasPerm("view_story")


@routes.projects.get(
    "/{id}/workflows",
    name="project.workflow.get",
    summary="Get project workflows",
    response_model=list[WorkflowSerializer],
    responses=ERROR_404 | ERROR_403,
)
async def get_project_workflows(
    request: Request, id: B64UUID = Query(None, description="the project id (B64UUID)")
) -> list[WorkflowSchema]:
    """
    Get project workflows
    """

    project = await get_project_or_404(id)
    await check_permissions(permissions=GET_PROJECT_WORKFLOWS, user=request.user, obj=project)
    return await workflows_services.get_project_workflows(project_id=id)


async def get_workflow_or_404(project_id: UUID, workflow_slug: str) -> WorkflowSchema:
    workflow = await workflows_services.get_project_workflow(project_id=project_id, workflow_slug=workflow_slug)
    if workflow is None:
        raise ex.NotFoundError(f"Workflow {workflow_slug} does not exist")

    return workflow
