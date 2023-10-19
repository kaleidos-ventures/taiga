# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC
from decimal import Decimal
from unittest.mock import patch

import pytest
from taiga.base.repositories.neighbors import Neighbor
from taiga.workflows import services
from taiga.workflows.services import exceptions as ex
from tests.utils import factories as f

#######################################################
# create_workflow
#######################################################


async def test_create_workflow_ok():
    project = f.build_project()
    workflow = f.build_workflow(project=project)

    with (
        patch("taiga.workflows.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        patch("taiga.workflows.services.projects_repositories", autospec=True) as fake_projects_repo,
        patch("taiga.workflows.services.workflows_events", autospec=True) as fake_workflows_events,
    ):
        fake_workflows_repo.list_workflows.return_value = None
        fake_workflows_repo.create_workflow.return_value = workflow
        fake_workflows_repo.list_workflow_statuses.return_value = []

        workflow = await services.create_workflow(project=workflow.project, name=workflow.name)

        fake_workflows_repo.list_workflows.assert_awaited_once_with(
            filters={"project_id": project.id}, order_by=["-order"]
        )
        fake_workflows_repo.create_workflow.assert_awaited_once_with(project=project, name=workflow.name, order=100)
        fake_projects_repo.get_project_template.assert_awaited_once()
        fake_workflows_repo.apply_default_workflow_statuses.assert_awaited_once()
        fake_workflows_repo.list_workflow_statuses.assert_awaited_once()

        fake_workflows_events.emit_event_when_workflow_is_created.assert_awaited_once_with(
            project=project, workflow=workflow
        )


async def test_create_workflow_reached_num_workflows_error(override_settings):
    project = f.build_project()
    workflow1 = f.build_workflow(project=project)
    workflow2 = f.build_workflow(project=project)

    with (
        patch("taiga.workflows.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        patch("taiga.workflows.services.projects_repositories", autospec=True) as fake_projects_repo,
        patch("taiga.workflows.services.workflows_events", autospec=True) as fake_workflows_events,
        override_settings({"MAX_NUM_WORKFLOWS": 1}),
        pytest.raises(ex.MaxNumWorkflowCreatedError),
    ):
        fake_workflows_repo.list_workflows.return_value = [workflow1]

        await services.create_workflow(project=workflow2.project, name=workflow2.name)

        fake_workflows_repo.list_workflows.assert_awaited_once_with(
            filters={"project_id": project.id}, order_by=["-order"]
        )
        fake_workflows_repo.create_workflow.assert_not_awaited()
        fake_projects_repo.get_project_template.assert_not_awaited()
        fake_workflows_repo.apply_default_workflow_statuses.assert_not_awaited()
        fake_workflows_repo.list_workflow_statuses.assert_not_awaited()
        fake_workflows_events.emit_event_when_workflow_is_created.assert_not_awaited()


#######################################################
# list_workflows
#######################################################


async def test_list_workflows_ok():
    workflow_status = f.build_workflow_status()
    workflows = [f.build_workflow(statuses=[workflow_status])]

    with patch("taiga.workflows.services.workflows_repositories", autospec=True) as fake_workflows_repo:
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

    with patch("taiga.workflows.services.workflows_repositories", autospec=True) as fake_workflows_repo:
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
# update_workflow
#######################################################


async def test_update_workflow_ok():
    project = f.build_project()
    workflow = f.build_workflow(project=project)
    values = {"name": "updated name"}

    with (
        patch("taiga.workflows.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        patch("taiga.workflows.services.get_workflow_detail", autospec=True),
        patch("taiga.workflows.services.workflows_events", autospec=True) as fake_workflows_events,
    ):
        updated_workflow = await services.update_workflow(project_id=project.id, workflow=workflow, values=values)
        fake_workflows_repo.update_workflow.assert_awaited_once_with(workflow=workflow, values=values)
        fake_workflows_events.emit_event_when_workflow_is_updated.assert_awaited_once_with(
            project=project,
            workflow=updated_workflow,
        )


#######################################################
# create_workflow_status
#######################################################


async def test_create_workflow_status_ok():
    workflow = f.build_workflow()
    status = f.build_workflow_status(workflow=workflow)

    with (
        patch("taiga.workflows.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        patch("taiga.workflows.services.workflows_events", autospec=True) as fake_workflows_events,
    ):
        fake_workflows_repo.list_workflow_statuses.return_value = None
        fake_workflows_repo.create_workflow_status.return_value = status
        fake_workflows_repo.get_workflow_statusreturn_value = status

        workflow_status = await services.create_workflow_status(
            name=status.name,
            color=status.color,
            workflow=status.workflow,
        )

        fake_workflows_repo.create_workflow_status.assert_awaited_once_with(
            name=status.name,
            color=status.color,
            order=Decimal(100),
            workflow=status.workflow,
        )

        fake_workflows_repo.list_workflow_statuses.assert_awaited_once_with(
            filters={"workflow_id": workflow.id}, order_by=["-order"], offset=0, limit=1
        )

        fake_workflows_events.emit_event_when_workflow_status_is_created.assert_awaited_once_with(
            project=workflow.project, workflow_status=workflow_status
        )


#######################################################
# update_workflow_status
#######################################################


async def test_update_workflow_status_ok():
    workflow = f.build_workflow()
    status = f.build_workflow_status(workflow=workflow)
    values = {"name": "New status name"}

    with (
        patch("taiga.workflows.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        patch("taiga.workflows.services.workflows_events", autospec=True) as fake_workflows_events,
    ):
        fake_workflows_repo.update_workflow_status.return_value = status
        await services.update_workflow_status(workflow_status=status, values=values)
        fake_workflows_repo.update_workflow_status.assert_awaited_once_with(workflow_status=status, values=values)
        fake_workflows_events.emit_event_when_workflow_status_is_updated.assert_awaited_once_with(
            project=workflow.project, workflow_status=status
        )


async def test_update_workflow_status_noop():
    status = f.build_workflow_status()
    values = {}

    with (
        patch("taiga.workflows.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        patch("taiga.workflows.services.workflows_events", autospec=True) as fake_workflows_events,
    ):
        ret_status = await services.update_workflow_status(workflow_status=status, values=values)

        assert ret_status == status
        fake_workflows_repo.update_workflow_status.assert_not_awaited()
        fake_workflows_events.emit_event_when_workflow_status_is_updated.assert_not_awaited()


async def test_update_workflow_status_none_name():
    status = f.build_workflow_status()
    values = {"name": None}

    with (
        pytest.raises(ex.TaigaServiceException),
        patch("taiga.workflows.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        patch("taiga.workflows.services.workflows_events", autospec=True) as fake_workflows_events,
    ):
        await services.update_workflow_status(workflow_status=status, values=values)
        fake_workflows_repo.update_workflow_status.assert_not_awaited()
        fake_workflows_events.emit_event_when_workflow_status_is_updated.assert_not_awaited()


#######################################################
# _calculate_offset
#######################################################


async def test_calculate_offset() -> None:
    workflow = f.build_workflow()

    with (patch("taiga.workflows.services.workflows_repositories", autospec=True) as fake_workflows_repo,):
        prev_st = f.build_workflow_status(workflow=workflow, order=150)
        reord_st = f.build_workflow_status(workflow=workflow, order=250)
        next_st = f.build_workflow_status(workflow=workflow, order=300)

        # after
        fake_workflows_repo.list_workflow_status_neighbors.return_value = Neighbor(prev=None, next=next_st)
        offset, pre_order = await services._calculate_offset(
            total_statuses_to_reorder=1, workflow=workflow, reorder_status=reord_st, reorder_place="after"
        )
        assert pre_order == reord_st.order
        assert offset == Decimal(25)

        fake_workflows_repo.list_workflow_status_neighbors.return_value = Neighbor(next=None, prev=None)
        offset, pre_order = await services._calculate_offset(
            total_statuses_to_reorder=1, workflow=workflow, reorder_status=reord_st, reorder_place="after"
        )
        assert pre_order == reord_st.order
        assert offset == Decimal(100)

        # before
        fake_workflows_repo.list_workflow_status_neighbors.return_value = Neighbor(next=None, prev=prev_st)
        offset, pre_order = await services._calculate_offset(
            total_statuses_to_reorder=1, workflow=workflow, reorder_status=reord_st, reorder_place="before"
        )
        assert pre_order == prev_st.order
        assert offset == Decimal(50)

        fake_workflows_repo.list_workflow_status_neighbors.return_value = Neighbor(next=None, prev=None)
        offset, pre_order = await services._calculate_offset(
            total_statuses_to_reorder=1, workflow=workflow, reorder_status=reord_st, reorder_place="before"
        )
        assert pre_order == Decimal(0)
        assert offset == Decimal(125)


#######################################################
# update reorder_statuses
#######################################################


async def test_reorder_workflow_statuses_ok():
    with (
        patch("taiga.workflows.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        patch("taiga.workflows.services.workflows_events", autospec=True) as fake_workflows_events,
    ):
        workflow = f.build_workflow()
        status1 = f.build_workflow_status(workflow=workflow, order=1)
        status2 = f.build_workflow_status(workflow=workflow, order=2)
        status3 = f.build_workflow_status(workflow=workflow, order=3)
        fake_workflows_repo.get_workflow_status.return_value = status1
        fake_workflows_repo.list_workflow_statuses_to_reorder.return_value = [status3, status2]

        await services.reorder_workflow_statuses(
            workflow=f.build_workflow(),
            statuses=[status3.id, status2.id],
            reorder={"place": "after", "status": status1.id},
        )

        fake_workflows_repo.bulk_update_workflow_statuses.assert_awaited_once_with(
            objs_to_update=[status3, status2], fields_to_update=["order"]
        )
        fake_workflows_events.emit_event_when_workflow_statuses_are_reordered.assert_awaited_once()


async def test_reorder_workflow_status_repeated():
    with (pytest.raises(ex.InvalidWorkflowStatusError),):
        await services.reorder_workflow_statuses(
            workflow=f.build_workflow(),
            statuses=["new"],
            reorder={"place": "after", "status": "new"},
        )


async def test_reorder_anchor_workflow_status_does_not_exist():
    with (
        patch("taiga.workflows.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        pytest.raises(ex.InvalidWorkflowStatusError),
    ):
        fake_workflows_repo.get_workflow_status.return_value = None

        await services.reorder_workflow_statuses(
            workflow=f.build_workflow(),
            statuses=["in-progress"],
            reorder={"place": "after", "status": "mooo"},
        )


async def test_reorder_any_workflow_status_does_not_exist():
    with (
        patch("taiga.workflows.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        pytest.raises(ex.InvalidWorkflowStatusError),
    ):
        fake_workflows_repo.get_workflow_status.return_value = None

        await services.reorder_workflow_statuses(
            workflow=f.build_workflow(),
            statuses=["in-progress", "mooo"],
            reorder={"place": "after", "status": "new"},
        )


#######################################################
# delete_workflow_status
#######################################################


async def test_delete_workflow_status_moving_stories_ok():
    user = f.create_user()
    workflow = f.build_workflow()
    workflow_status1 = f.build_workflow_status(workflow=workflow)
    workflow_status2 = f.build_workflow_status(workflow=workflow)
    workflow_status1_stories = [f.build_story(status=workflow_status1, workflow=workflow)]

    with (
        patch("taiga.workflows.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        patch("taiga.workflows.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch("taiga.workflows.services.workflows_events", autospec=True) as fake_workflows_events,
        patch("taiga.workflows.services.get_workflow_status", autospec=True) as fake_get_workflow_status,
        patch("taiga.workflows.services.stories_services", autospec=True) as fake_stories_services,
    ):
        fake_workflows_repo.delete_workflow_status.return_value = 1
        fake_get_workflow_status.return_value = workflow_status2
        fake_stories_repo.list_stories.return_value = workflow_status1_stories
        fake_stories_services.reorder_stories.return_value = None

        await services.delete_workflow_status(
            workflow_status=workflow_status1, target_status_id=workflow_status2.id, deleted_by=user
        )

        fake_get_workflow_status.assert_awaited_once_with(
            project_id=workflow.project.id, workflow_slug=workflow.slug, id=workflow_status2.id
        )
        fake_stories_repo.list_stories.assert_awaited_once_with(
            filters={
                "status_id": workflow_status1.id,
            },
            order_by=["order"],
        )
        fake_stories_services.reorder_stories.assert_awaited_once_with(
            reordered_by=user,
            project=workflow_status1.project,
            workflow=workflow,
            target_status_id=workflow_status2.id,
            stories_refs=[story.ref for story in workflow_status1_stories],
        )
        fake_workflows_repo.delete_workflow_status.assert_awaited_once_with(filters={"id": workflow_status1.id})
        fake_workflows_events.emit_event_when_workflow_status_is_deleted.assert_awaited_once_with(
            project=workflow_status1.project,
            workflow_status=workflow_status1,
            target_status=workflow_status2,
        )


async def test_delete_workflow_status_deleting_stories_ok():
    user = f.create_user()
    workflow = f.build_workflow()
    workflow_status1 = f.build_workflow_status(workflow=workflow)
    workflow_status1_stories = [f.build_story(status=workflow_status1, workflow=workflow)]

    with (
        patch("taiga.workflows.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        patch("taiga.workflows.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch("taiga.workflows.services.workflows_events", autospec=True) as fake_workflows_events,
        patch("taiga.workflows.services.get_workflow_status", autospec=True) as fake_get_workflow_status,
        patch("taiga.workflows.services.stories_services", autospec=True) as fake_stories_services,
    ):
        fake_workflows_repo.delete_workflow_status.return_value = 2
        fake_workflows_repo.get_workflow_status.return_value = 1
        fake_stories_repo.list_stories.return_value = workflow_status1_stories
        fake_stories_services.reorder_stories.return_value = None

        await services.delete_workflow_status(workflow_status=workflow_status1, target_status_id=None, deleted_by=user)

        fake_get_workflow_status.assert_not_awaited()
        fake_stories_repo.list_stories.assert_not_awaited()
        fake_stories_services.reorder_stories.assert_not_awaited()
        fake_workflows_repo.delete_workflow_status.assert_awaited_once_with(filters={"id": workflow_status1.id})
        fake_workflows_events.emit_event_when_workflow_status_is_deleted.assert_awaited_once_with(
            project=workflow_status1.project, workflow_status=workflow_status1, target_status=None
        )


async def test_delete_workflow_status_wrong_target_status_ex():
    user = f.create_user()
    workflow = f.build_workflow()
    workflow_status1 = f.build_workflow_status(workflow=workflow)
    workflow_status2 = f.build_workflow_status(workflow=workflow)

    with (
        patch("taiga.workflows.services.get_workflow_status", autospec=True) as fake_get_workflow_status,
        pytest.raises(ex.NonExistingMoveToStatus),
    ):
        fake_get_workflow_status.return_value = None

        await services.delete_workflow_status(
            workflow_status=workflow_status1, target_status_id=workflow_status2.id, deleted_by=user
        )

        fake_get_workflow_status.assert_awaited_once_with(
            project_id=workflow.project.id, workflow_slug=workflow.slug, id=workflow_status2.id
        )


async def test_delete_workflow_status_same_target_status_ex():
    user = f.create_user()
    workflow = f.build_workflow()
    workflow_status1 = f.build_workflow_status(workflow=workflow)

    with (
        patch("taiga.workflows.services.get_workflow_status", autospec=True) as fake_get_workflow_status,
        pytest.raises(ex.SameMoveToStatus),
    ):
        fake_get_workflow_status.return_value = workflow_status1

        await services.delete_workflow_status(
            workflow_status=workflow_status1, target_status_id=workflow_status1.id, deleted_by=user
        )

        fake_get_workflow_status.assert_awaited_once_with(
            project_id=workflow.project.id, workflow_slug=workflow.slug, id=workflow_status1.id
        )
