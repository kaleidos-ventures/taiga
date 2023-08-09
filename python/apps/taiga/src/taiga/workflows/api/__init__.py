# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC
from uuid import UUID

from fastapi import Depends
from starlette import status
from taiga.base.api import AuthRequest, Request, responses
from taiga.base.api.permissions import check_permissions
from taiga.base.validators import B64UUID
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import HasPerm, IsProjectAdmin
from taiga.projects.projects.api import get_project_or_404
from taiga.routers import routes
from taiga.workflows import services as workflows_services
from taiga.workflows.api.validators import (
    DeleteWorkflowStatusQuery,
    ReorderWorkflowStatusesValidator,
    UpdateWorkflowStatusValidator,
    WorkflowStatusValidator,
)
from taiga.workflows.models import Workflow, WorkflowStatus
from taiga.workflows.serializers import ReorderWorkflowStatusesSerializer, WorkflowSerializer, WorkflowStatusSerializer

# PERMISSIONS
LIST_WORKFLOWS = HasPerm("view_story")
GET_WORKFLOW = HasPerm("view_story")
CREATE_WORKFLOW_STATUS = IsProjectAdmin()
UPDATE_WORKFLOW_STATUS = IsProjectAdmin()
DELETE_WORKFLOW_STATUS = IsProjectAdmin()
REORDER_WORKFLOW_STATUSES = IsProjectAdmin()

# HTTP 200 RESPONSES
GET_WORKFLOW_200 = responses.http_status_200(model=WorkflowSerializer)
LIST_WORKFLOW_200 = responses.http_status_200(model=list[WorkflowSerializer])
REORDER_WORKFLOW_STATUSES_200 = responses.http_status_200(model=ReorderWorkflowStatusesSerializer)


################################################
# list workflows
################################################


@routes.stories.get(
    "/projects/{id}/workflows",
    name="project.workflow.list",
    summary="List workflows",
    responses=LIST_WORKFLOW_200 | ERROR_403 | ERROR_404 | ERROR_422,
    response_model=None,
)
async def list_workflows(id: B64UUID, request: Request) -> list[WorkflowSerializer]:
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
    responses=GET_WORKFLOW_200 | ERROR_403 | ERROR_404 | ERROR_422,
    response_model=None,
)
async def get_workflow(
    id: B64UUID,
    workflow_slug: str,
    request: Request,
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
    responses=ERROR_403 | ERROR_404 | ERROR_422,
)
async def create_workflow_status(
    project_id: B64UUID,
    workflow_slug: str,
    request: AuthRequest,
    form: WorkflowStatusValidator,
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
    "/projects/{project_id}/workflows/{workflow_slug}/statuses/{id}",
    name="project.workflowstatus.update",
    summary="Update workflow status",
    response_model=WorkflowStatusSerializer,
    responses=ERROR_403 | ERROR_404 | ERROR_422,
)
async def update_workflow_status(
    id: B64UUID,
    project_id: B64UUID,
    workflow_slug: str,
    request: AuthRequest,
    form: UpdateWorkflowStatusValidator,
) -> WorkflowStatus:
    """
    Updates a workflow status in the given project workflow
    """
    workflow_status = await get_workflow_status_or_404(project_id=project_id, workflow_slug=workflow_slug, id=id)
    await check_permissions(permissions=UPDATE_WORKFLOW_STATUS, user=request.user, obj=workflow_status)

    return await workflows_services.update_workflow_status(
        workflow_status=workflow_status,
        values=form.dict(exclude_unset=True),
    )


################################################
# update - reorder workflow statuses
################################################


@routes.stories.post(
    "/projects/{project_id}/workflows/{workflow_slug}/statuses/reorder",
    name="project.workflowstatus.reorder",
    summary="Reorder workflow statuses",
    responses=REORDER_WORKFLOW_STATUSES_200 | ERROR_403 | ERROR_404 | ERROR_422,
    response_model=None,
)
async def reorder_workflow_statuses(
    project_id: B64UUID,
    workflow_slug: str,
    request: AuthRequest,
    form: ReorderWorkflowStatusesValidator,
) -> ReorderWorkflowStatusesSerializer:
    """
    Reorder one or more workflow statuses; it may change workflow and order
    """
    workflow = await get_workflow_or_404(project_id=project_id, workflow_slug=workflow_slug)
    await check_permissions(permissions=REORDER_WORKFLOW_STATUSES, user=request.user, obj=workflow)

    return await workflows_services.reorder_workflow_statuses(
        workflow=workflow,
        statuses=form.statuses,
        reorder=form.get_reorder_dict(),
    )


################################################
# delete workflow status
################################################


@routes.stories.delete(
    "/projects/{project_id}/workflows/{workflow_slug}/statuses/{id}",
    name="project.workflowstatus.delete",
    summary="Delete a workflow status",
    responses=ERROR_403 | ERROR_404 | ERROR_422,
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_workflow_status(
    id: B64UUID,
    project_id: B64UUID,
    workflow_slug: str,
    request: AuthRequest,
    query_params: DeleteWorkflowStatusQuery = Depends(),
) -> None:
    """
    Deletes a workflow status in the given project workflow, providing the option to replace the stories it may contain
    to any other existing workflow status in the same workflow.

    Query params:

    * **move_to:** the workflow status's slug to which move the stories from the status being deleted
        - if not received, the workflow status and its contained stories will be deleted
        - if received, the workflow status will be deleted but its contained stories won't (they will be first moved to
         the specified status).
    """
    workflow_status = await get_workflow_status_or_404(project_id=project_id, workflow_slug=workflow_slug, id=id)
    await check_permissions(permissions=DELETE_WORKFLOW_STATUS, user=request.user, obj=workflow_status)

    await workflows_services.delete_workflow_status(
        workflow_status=workflow_status,
        target_status_id=query_params.move_to,  # type: ignore
    )


################################################
# misc
################################################


async def get_workflow_status_or_404(project_id: UUID, workflow_slug: str, id: UUID) -> WorkflowStatus:
    workflow_status = await workflows_services.get_workflow_status(
        project_id=project_id, workflow_slug=workflow_slug, id=id
    )
    if workflow_status is None:
        raise ex.NotFoundError("Workflow status does not exist")

    return workflow_status
