# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from taiga.tasks import repositories
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# create_task
##########################################################


async def test_create_task_ok() -> None:
    user = await f.create_user()
    project = await f.create_simple_project()
    workflow = await f.create_workflow(project=project)
    status = await f.create_workflow_status(workflow=workflow)

    task = await repositories.create_task(
        name="test_create_task_ok", project_id=project.id, workflow_id=workflow.id, status_id=status.id, user_id=user.id
    )

    assert task.name == "test_create_task_ok"


##########################################################
# get_tasks_by_workflow
##########################################################
async def test_get_tasks_by_workflow_ok() -> None:
    task1 = await f.create_task()
    task2 = await (
        f.create_task(
            project=task1.project, workflow=task1.workflow, status=task1.status, created_by=task1.project.owner
        )
    )
    total_tasks = await repositories.get_total_tasks_by_workflow(
        project_slug=task1.project.slug, workflow_slug=task1.workflow.slug
    )
    both_tasks = await repositories.get_tasks_by_workflow(
        project_slug=task1.project.slug, workflow_slug=task1.workflow.slug
    )

    assert total_tasks == 2
    assert task1 in both_tasks
    assert task2 in both_tasks

    paginated_tasks = await repositories.get_tasks_by_workflow(
        project_slug=task1.project.slug, workflow_slug=task1.workflow.slug, offset=1, limit=1
    )

    assert task1 not in paginated_tasks
    assert task2 in paginated_tasks
