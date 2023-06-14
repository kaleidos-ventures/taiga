# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from decimal import Decimal
from unittest.mock import patch

from taiga.workflows import services
from tests.utils import factories as f

#######################################################
# list_workflows
#######################################################


async def test_list_workflows_ok():
    workflow_status = f.build_workflow_status()
    workflows = [f.build_workflow(statuses=[workflow_status])]

    with (patch("taiga.workflows.services.workflows_repositories", autospec=True) as fake_workflows_repo):
        fake_workflows_repo.list_workflows.return_value = workflows
        fake_workflows_repo.list_workflow_statuses.return_value = [workflow_status]
        await services.list_workflows(project_id=workflows[0].project.id)
        fake_workflows_repo.list_workflows.assert_awaited_once_with(
            filters={"project_id": workflows[0].project.id},
            prefetch_related=["statuses"],
        )


#######################################################
# get_workflow
#######################################################


async def test_get_workflow_ok():
    workflow = f.build_workflow()

    with (patch("taiga.workflows.services.workflows_repositories", autospec=True) as fake_workflows_repo):
        fake_workflows_repo.get_workflow.return_value = workflow
        await services.get_workflow(project_id=workflow.project.id, workflow_slug=workflow.slug)
        fake_workflows_repo.get_workflow.assert_awaited_once()


async def test_get_detailed_workflow_ok():
    workflow_status = f.build_workflow_status()
    workflow = f.build_workflow(statuses=[workflow_status])

    with (patch("taiga.workflows.services.workflows_repositories", autospec=True) as fake_workflows_repo,):
        fake_workflows_repo.get_workflow.return_value = workflow
        fake_workflows_repo.list_workflow_statuses.return_value = [workflow_status]
        await services.get_workflow_detail(project_id="id", workflow_slug="main")
        fake_workflows_repo.get_workflow.assert_awaited_once()


#######################################################
# create_workflow_status
#######################################################


async def test_create_workflow_status_ok():
    workflow = f.build_workflow()
    status = f.build_workflow_status(workflow=workflow)

    with (
        patch("taiga.workflows.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        patch("taiga.workflows.services.workflow_events", autospec=True) as fake_workflow_events,
    ):
        fake_workflows_repo.list_workflow_statuses.return_value = None
        fake_workflows_repo.create_workflow_status.return_value = status
        fake_workflows_repo.get_status.return_value = status

        workflow_status = await services.create_workflow_status(
            name=status.name,
            color=status.color,
            workflow=status.workflow,
        )

        fake_workflows_repo.create_workflow_status.assert_awaited_once_with(
            name=status.name,
            slug=None,
            color=status.color,
            order=Decimal(100),
            workflow=status.workflow,
        )

        fake_workflows_repo.list_workflow_statuses.assert_awaited_once_with(
            filters={"workflow_id": workflow.id}, order_by=["-order"], offset=0, limit=1
        )

        fake_workflows_repo.get_status.assert_awaited_once_with(
            filters={
                "workflow_id": workflow.id,
                "slug": status.slug,
            },
            select_related=["workflow"],
        )

        fake_workflow_events.emit_event_when_workflow_status_is_created.assert_awaited_once_with(
            project=workflow.project, status=workflow_status
        )


#######################################################
# get_status_detail
#######################################################


async def test_get_status_detail_ok():
    workflow = f.build_workflow()
    status = f.build_workflow_status(workflow=workflow)

    with patch("taiga.workflows.services.workflows_repositories", autospec=True) as fake_workflows_repo:
        fake_workflows_repo.get_status.return_value = status

        await services.get_status_detail(workflow_id=workflow.id, status_slug=status.slug)

        fake_workflows_repo.get_status.assert_awaited_once_with(
            filters={
                "workflow_id": workflow.id,
                "slug": status.slug,
            },
            select_related=["workflow"],
        )
