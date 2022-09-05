# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from uuid import UUID

from asgiref.sync import sync_to_async
from django.db.models import QuerySet
from taiga.tasks.models import Task


@sync_to_async
def create_task(
    name: str,
    project_id: UUID,
    workflow_id: UUID,
    status_id: UUID,
    user_id: UUID,
) -> Task:

    task = Task.objects.create(
        name=name,
        project_id=project_id,
        workflow_id=workflow_id,
        status_id=status_id,
        created_by_id=user_id,
    )

    return Task.objects.select_related("project", "workflow", "status", "project__workspace").get(id=task.id)


@sync_to_async
def get_total_tasks_by_workflow(project_slug: str, workflow_slug: str) -> int:
    qs = _get_tasks_by_workflow_qs(project_slug=project_slug, workflow_slug=workflow_slug)
    return qs.count()


@sync_to_async
def get_tasks_by_workflow(project_slug: str, workflow_slug: str, offset: int = 0, limit: int = 0) -> list[Task]:
    qs = _get_tasks_by_workflow_qs(project_slug=project_slug, workflow_slug=workflow_slug).order_by(
        "order", "created_at"
    )
    if limit:
        return list(qs[offset : offset + limit])

    return list(qs)


def _get_tasks_by_workflow_qs(project_slug: str, workflow_slug: str) -> QuerySet[Task]:
    tasks_qs = Task.objects.select_related("project", "workflow", "status").filter(
        project__slug=project_slug, workflow__slug=workflow_slug
    )
    return tasks_qs
