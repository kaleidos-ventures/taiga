# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from uuid import UUID

from fastapi import Query
from taiga.base.api import AuthRequest, Request, responses
from taiga.base.api.permissions import check_permissions
from taiga.base.validators import B64UUID
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import HasPerm, IsProjectAdmin
from taiga.projects.projects.api import get_project_or_404
from taiga.routers import routes
from taiga.workflows import services as workflows_services
from taiga.workflows.api.validators import UpdateWorkflowStatusValidator, WorkflowStatusValidator
from taiga.workflows.models import Workflow, WorkflowStatus
from taiga.workflows.serializers import WorkflowSerializer, WorkflowStatusSerializer

# PERMISSIONS
LIST_WORKFLOWS = HasPerm("view_story")
GET_WORKFLOW = HasPerm("view_story")
CREATE_WORKFLOW_STATUS = IsProjectAdmin()
UPDATE_WORKFLOW_STATUS = IsProjectAdmin()

# HTTP 200 RESPONSES
WORKFLOW_200 = responses.http_status_200(model=WorkflowSerializer)
LIST_WORKFLOW_200 = responses.http_status_200(model=list[WorkflowSerializer])


################################################
# list workflows
################################################


@routes.stories.get(
    "/projects/{id}/workflows",
    name="project.workflow.list",
    summary="List workflows",
    responses=LIST_WORKFLOW_200 | ERROR_404 | ERROR_403,
)
async def list_workflows(
    request: Request,
    id: B64UUID = Query(None, description="the project id (B64UUID)"),
) -> list[WorkflowSerializer]:
    """
    List the workflows of a project
    """
    project = await get_project_or_404(id)
    await check_permissions(permissions=LIST_WORKFLOWS, user=request.user, obj=project)
    return await workflows_services.list_workflows(project_id=id)


################################################
# get workflow
################################################


@routes.stories.get(
    "/projects/{id}/workflows/{workflow_slug}",
    name="project.workflow.get",
    summary="Get project workflow",
    responses=WORKFLOW_200 | ERROR_404 | ERROR_403,
)
async def get_workflow(
    request: Request,
    id: B64UUID = Query(None, description="the project id (B64UUID)"),
    workflow_slug: str = Query(None, description="the workflow slug (str)"),
) -> WorkflowSerializer:
    """
    Get the details of a workflow
    """
    workflow = await get_workflow_or_404(project_id=id, workflow_slug=workflow_slug)
    await check_permissions(permissions=GET_WORKFLOW, user=request.user, obj=workflow)
    return await workflows_services.get_workflow_detail(project_id=id, workflow_slug=workflow_slug)


################################################
# misc
################################################


async def get_workflow_or_404(project_id: UUID, workflow_slug: str) -> Workflow:
    workflow = await workflows_services.get_workflow(project_id=project_id, workflow_slug=workflow_slug)
    if workflow is None:
        raise ex.NotFoundError(f"Workflow {workflow_slug} does not exist")

    return workflow


################################################
# create workflow status
################################################


@routes.stories.post(
    "/projects/{project_id}/workflows/{workflow_slug}/statuses",
    name="project.workflowstatus.create",
    summary="Create a workflow status",
    response_model=WorkflowStatusSerializer,
    responses=ERROR_404 | ERROR_422 | ERROR_403,
)
async def create_workflow_status(
    request: AuthRequest,
    form: WorkflowStatusValidator,
    project_id: B64UUID = Query(None, description="the project id (B64UUID)"),
    workflow_slug: str = Query(None, description="the workflow slug (str)"),
) -> WorkflowStatus:
    """
    Creates a workflow status in the given project workflow
    """
    workflow = await get_workflow_or_404(project_id=project_id, workflow_slug=workflow_slug)
    await check_permissions(permissions=CREATE_WORKFLOW_STATUS, user=request.user, obj=workflow)

    return await workflows_services.create_workflow_status(
        name=form.name,
        color=form.color,
        workflow=workflow,
    )


################################################
# update workflow status
################################################


@routes.stories.patch(
    "/projects/{project_id}/workflows/{workflow_slug}/statuses/{slug}",
    name="project.workflowstatus.update",
    summary="Update workflow status",
    response_model=WorkflowStatusSerializer,
    responses=ERROR_404 | ERROR_422 | ERROR_403,
)
async def update_workflow_status(
    request: AuthRequest,
    form: UpdateWorkflowStatusValidator,
    project_id: B64UUID = Query(None, description="the project id (B64UUID)"),
    workflow_slug: str = Query(None, description="the workflow slug (str)"),
    slug: str = Query(None, description="the status slug (str)"),
) -> WorkflowStatus:
    """
    Updates a workflow status in the given project workflow
    """
    workflow = await get_workflow_or_404(project_id=project_id, workflow_slug=workflow_slug)
    await check_permissions(permissions=UPDATE_WORKFLOW_STATUS, user=request.user, obj=workflow)
    workflow_status = await get_workflow_status_or_404(workflow_id=workflow.id, workflow_status_slug=slug)

    return await workflows_services.update_workflow_status(
        workflow=workflow,
        workflow_status=workflow_status,
        values=form.dict(exclude_unset=True),
    )


################################################
# misc
################################################


async def get_workflow_status_or_404(workflow_id: UUID, workflow_status_slug: str) -> WorkflowStatus:
    status = await workflows_services.get_status(workflow_id=workflow_id, status_slug=workflow_status_slug)
    if status is None:
        raise ex.NotFoundError(f"Workflow status {workflow_status_slug} does not exist")

    return status
