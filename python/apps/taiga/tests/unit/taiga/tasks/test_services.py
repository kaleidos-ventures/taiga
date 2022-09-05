# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import patch

import pytest
from taiga.tasks import services
from taiga.tasks.services import exceptions as ex
from taiga.workflows import dataclasses as dt
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


#######################################################
# get_paginated_tasks_by_workflow
#######################################################


async def test_get_project_invitation_ok():
    task = f.build_task()

    with (patch("taiga.tasks.services.tasks_repositories", autospec=True) as fake_tasks_repo,):
        fake_tasks_repo.get_total_tasks_by_workflow.return_value = 1
        fake_tasks_repo.get_tasks_by_workflow.return_value = [task]
        await services.get_paginated_tasks_by_workflow(
            project_slug=task.project.slug, workflow_slug=task.workflow.slug, offset=0, limit=10
        )
        fake_tasks_repo.get_total_tasks_by_workflow.assert_awaited_once_with(
            project_slug=task.project.slug, workflow_slug=task.workflow.slug
        )
        fake_tasks_repo.get_tasks_by_workflow.assert_awaited_once_with(
            project_slug=task.project.slug, workflow_slug=task.workflow.slug, offset=0, limit=10
        )


#######################################################
# create_task
#######################################################


async def test_create_task_ok():
    user = f.build_user()
    task = f.build_task()

    with (
        patch("taiga.tasks.services.tasks_repositories", autospec=True) as fake_tasks_repo,
        patch("taiga.tasks.services.tasks_events", autospec=True) as fake_tasks_events,
    ):
        fake_tasks_repo.create_task.return_value = task

        await services.create_task(
            project=task.project,
            workflow=build_worklow_dt(task),
            name=task.name,
            status_slug=task.status.slug,
            user=user,
        )
        fake_tasks_repo.create_task.assert_awaited_once_with(
            name=task.name,
            project_id=task.project.id,
            workflow_id=task.workflow.id,
            status_id=task.status.id,
            user_id=user.id,
        )
        fake_tasks_events.emit_event_when_task_is_created.assert_awaited_once_with(task=task)


async def test_create_task_invalid_status():
    user = f.build_user()
    task1 = f.build_task()
    task2 = f.build_task()

    with (patch("taiga.tasks.services.tasks_events", autospec=True), pytest.raises(ex.InvalidStatusError)):

        await services.create_task(
            project=task1.project,
            workflow=build_worklow_dt(task1),
            name=task1.name,
            status_slug=task2.status.slug,
            user=user,
        )


#######################################################
# utils
#######################################################


def build_worklow_dt(task):
    return dt.Workflow(
        id=task.workflow.id,
        name=task.workflow.name,
        slug=task.workflow.slug,
        order=task.workflow.order,
        statuses=[task.status],
    )
