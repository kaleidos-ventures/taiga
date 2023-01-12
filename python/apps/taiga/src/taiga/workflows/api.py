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
from taiga.workflows.models import Workflow
from taiga.workflows.schemas import WorkflowSchema
from taiga.workflows.serializers import WorkflowSerializer

# PERMISSIONS
LIST_WORKFLOWS = HasPerm("view_story")
GET_WORKFLOW = HasPerm("view_story")


@routes.projects.get(
    "/{id}/workflows",
    name="project.workflow.list",
    summary="List workflows",
    response_model=list[WorkflowSerializer],
    responses=ERROR_404 | ERROR_403,
)
async def list_workflows(
    request: Request,
    id: B64UUID = Query(None, description="the project id (B64UUID)"),
) -> list[WorkflowSchema]:
    """
    List the workflows of a project
    """
    project = await get_project_or_404(id)
    await check_permissions(permissions=LIST_WORKFLOWS, user=request.user, obj=project)
    return await workflows_services.list_workflows_dt(project_id=id)


@routes.projects.get(
    "/{id}/workflows/{workflow_slug}",
    name="project.workflow.get",
    summary="Get project workflow",
    response_model=WorkflowSerializer,
    responses=ERROR_404 | ERROR_403,
)
async def get_workflow(
    request: Request,
    id: B64UUID = Query(None, description="the project id (B64UUID)"),
    workflow_slug: str = Query(None, description="the workflow slug (str)"),
) -> WorkflowSchema:
    """
    Get the details of a workflow
    """
    workflow = await get_workflow_or_404(project_id=id, workflow_slug=workflow_slug)
    await check_permissions(permissions=GET_WORKFLOW, user=request.user, obj=workflow)
    return await workflows_services.get_workflow_dt(
        project_id=id, workflow_slug=workflow_slug
    )  # type: ignore[return-value]


async def get_workflow_or_404(project_id: UUID, workflow_slug: str) -> Workflow:
    workflow = await workflows_services.get_workflow(project_id=project_id, workflow_slug=workflow_slug)
    if workflow is None:
        raise ex.NotFoundError(f"Workflow {workflow_slug} does not exist")

    return workflow
