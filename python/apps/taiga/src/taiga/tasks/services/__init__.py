# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


from taiga.base.api import Pagination
from taiga.projects.models import Project
from taiga.tasks import events as tasks_events
from taiga.tasks import repositories as tasks_repositories
from taiga.tasks.models import Task
from taiga.tasks.services.exceptions import InvalidStatusError
from taiga.users.models import User
from taiga.workflows import dataclasses as dt


async def create_task(project: Project, workflow: dt.Workflow, name: str, status_slug: str, user: User) -> Task:
    try:
        workflow_status = next(status for status in workflow.statuses if status.slug == status_slug)
    except StopIteration:
        raise InvalidStatusError("The provided status is not valid.")

    task = await tasks_repositories.create_task(
        name=name, project_id=project.id, workflow_id=workflow.id, status_id=workflow_status.id, user_id=user.id
    )

    await tasks_events.emit_event_when_task_is_created(task=task)

    return task


async def get_paginated_tasks_by_workflow(
    project_slug: str, workflow_slug: str, offset: int, limit: int
) -> tuple[Pagination, list[Task]]:

    total_tasks = await tasks_repositories.get_total_tasks_by_workflow(
        project_slug=project_slug, workflow_slug=workflow_slug
    )

    tasks = await tasks_repositories.get_tasks_by_workflow(
        project_slug=project_slug, workflow_slug=workflow_slug, offset=offset, limit=limit
    )

    pagination = Pagination(offset=offset, limit=limit, total=total_tasks)

    return pagination, tasks
