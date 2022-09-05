# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import Depends, Query
from starlette.responses import Response
from taiga.base.api import AuthRequest, PaginationQuery, set_pagination
from taiga.base.api.permissions import check_permissions
from taiga.exceptions.api.errors import ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import HasPerm
from taiga.projects.api import get_project_or_404
from taiga.routers import routes
from taiga.tasks import services as tasks_services
from taiga.tasks.models import Task
from taiga.tasks.serializers import TaskSerializer
from taiga.tasks.validators import TaskValidator
from taiga.workflows.api import get_workflow_or_404

# PERMISSIONS
CREATE_TASK = HasPerm("add_task")
LIST_TASKS = HasPerm("view_task")


################################################
# TASKS
################################################


@routes.projects.post(
    "/{project_slug}/workflows/{workflow_slug}/tasks",
    name="project.tasks.create",
    summary="Create a task in a workflow status",
    response_model=TaskSerializer,
    responses=ERROR_404 | ERROR_422 | ERROR_403,
)
async def create_task(
    request: AuthRequest,
    form: TaskValidator,
    project_slug: str = Query(None, description="the project slug (str)"),
    workflow_slug: str = Query(None, description="the workflow slug (str)"),
) -> Task:
    """
    Creates a task for the logged user in the given workflow and status
    """
    project = await get_project_or_404(project_slug)
    await check_permissions(permissions=CREATE_TASK, user=request.user, obj=project)
    workflow = await get_workflow_or_404(project_slug=project_slug, workflow_slug=workflow_slug)

    return await tasks_services.create_task(
        name=form.name, project=project, workflow=workflow, status_slug=form.status, user=request.user
    )


@routes.projects.get(
    "/{project_slug}/workflows/{workflow_slug}/tasks",
    name="project.tasks.get",
    summary="List all the tasks for a project workflow",
    response_model=list[TaskSerializer],
    responses=ERROR_404 | ERROR_403,
)
async def list_tasks(
    request: AuthRequest,
    response: Response,
    pagination_params: PaginationQuery = Depends(),
    project_slug: str = Query(None, description="the project slug (str)"),
    workflow_slug: str = Query(None, description="the workflow slug (str)"),
) -> list[Task]:
    """
    List all the tasks for a project workflow and all of its statuses
    """
    project = await get_project_or_404(project_slug)
    await check_permissions(permissions=LIST_TASKS, user=request.user, obj=project)
    await get_workflow_or_404(project_slug=project_slug, workflow_slug=workflow_slug)

    pagination, tasks = await tasks_services.get_paginated_tasks_by_workflow(
        project_slug=project_slug,
        workflow_slug=workflow_slug,
        offset=pagination_params.offset,
        limit=pagination_params.limit,
    )

    set_pagination(response=response, pagination=pagination)

    return tasks
