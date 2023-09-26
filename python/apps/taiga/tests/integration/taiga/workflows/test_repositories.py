# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import uuid

import pytest
from asgiref.sync import sync_to_async
from taiga.projects.projects.models import Project
from taiga.workflows import repositories
from taiga.workflows.models import Workflow, WorkflowStatus
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# create_workflow
##########################################################


async def test_create_workflow():
    project = await f.create_project()
    workflow_res = await repositories.create_workflow(
        name="workflow",
        order=1,
        project=project,
    )
    assert workflow_res.name == "workflow"
    assert workflow_res.project == project


##########################################################
# list_workflows
##########################################################


async def test_list_workflows_schemas_ok() -> None:
    project = await f.create_project()
    workflows = await repositories.list_workflows(filters={"project_id": project.id}, prefetch_related=["statuses"])

    assert len(workflows) == 1
    assert len(await _list_workflow_statuses(workflow=workflows[0])) == 4
    assert hasattr(workflows[0], "id")


async def test_list_project_without_workflows_ok() -> None:
    project = await f.create_simple_project()
    workflows = await repositories.list_workflows(filters={"project_id": project.id})

    assert len(workflows) == 0


##########################################################
# get_workflow
##########################################################


async def test_get_workflow_ok() -> None:
    project = await f.create_project()
    workflows = await _list_workflows(project=project)
    workflow = await repositories.get_workflow(filters={"project_id": project.id, "slug": workflows[0].slug})
    assert workflow is not None
    assert hasattr(workflow, "id")


async def test_get_project_without_workflow_ok() -> None:
    project = await f.create_simple_project()
    workflow = await repositories.get_workflow(filters={"project_id": project.id, "slug": "not-existing-slug"})
    assert workflow is None


##########################################################
# update_workflow
##########################################################


async def test_update_workflow():
    workflow = await f.create_workflow()
    updated_workflow = await repositories.update_workflow(
        workflow=workflow,
        values={"name": "Updated name"},
    )
    assert updated_workflow.name == "Updated name"


#########################################################
# delete workflow
##########################################################


async def test_delete_workflow_without_workflow_statuses_ok() -> None:
    project = await f.create_project()
    workflow = await f.create_workflow(project=project, statuses=[])

    delete_ret = await repositories.delete_workflow(filters={"id": workflow.id})
    assert delete_ret == 1


async def test_delete_workflow_with_workflow_statuses_ok() -> None:
    project = await f.create_project()
    workflow = await f.create_workflow(project=project)

    delete_ret = await repositories.delete_workflow(filters={"id": workflow.id})
    assert delete_ret == 4


##########################################################
# create_workflow_status
##########################################################


async def test_create_workflow_status():
    workflow = await f.create_workflow()

    workflow_status_res = await repositories.create_workflow_status(
        name="workflow-status",
        color=1,
        order=1,
        workflow=workflow,
    )
    assert workflow_status_res.name == "workflow-status"
    assert workflow_status_res.workflow == workflow


##########################################################
# list_workflows_statuses
##########################################################


async def test_list_workflows_statuses_ok() -> None:
    workflow = await f.create_workflow()
    statuses = await repositories.list_workflow_statuses(filters={"workflow_id": workflow.id})

    assert len(statuses) > 0


async def test_list_no_workflows_statuses() -> None:
    workflow = await f.create_workflow(statuses=[])
    statuses = await repositories.list_workflow_statuses(filters={"workflow_id": workflow.id})

    assert len(statuses) == 0


##########################################################
# list_workflows_statuses_to_reorder
##########################################################


async def test_list_statuses_to_reorder() -> None:
    project = await f.create_project()
    workflow = await sync_to_async(project.workflows.first)()
    st_ids = [s.id for s in await _list_workflow_statuses(workflow=workflow)]

    # New(0), Ready(1), In progress(2), Done(3)

    statuses = [st_ids[1], st_ids[0], st_ids[3]]
    statuses = await repositories.list_workflow_statuses_to_reorder(
        filters={"workflow_id": workflow.id, "ids": statuses}
    )
    assert statuses[0].id == statuses[0].id
    assert statuses[1].id == statuses[1].id
    assert statuses[2].id == statuses[2].id

    statuses = [st_ids[3], st_ids[1], st_ids[0]]
    statuses = await repositories.list_workflow_statuses_to_reorder(
        filters={"workflow_id": workflow.id, "ids": statuses}
    )
    assert statuses[0].id == statuses[0].id
    assert statuses[1].id == statuses[1].id
    assert statuses[2].id == statuses[2].id

    statuses = [st_ids[0], st_ids[1]]
    statuses = await repositories.list_workflow_statuses_to_reorder(
        filters={"workflow_id": workflow.id, "ids": statuses}
    )
    assert statuses[0].id == statuses[0].id
    assert statuses[1].id == statuses[1].id


async def test_list_statuses_to_reorder_bad_ids() -> None:
    project = await f.create_project()
    workflow = await sync_to_async(project.workflows.first)()
    st_ids = [s.id for s in await _list_workflow_statuses(workflow=workflow)]
    non_existing_uuid = uuid.uuid1()

    statuses = [st_ids[0], non_existing_uuid]
    statuses = await repositories.list_workflow_statuses_to_reorder(
        filters={"workflow_id": workflow.id, "ids": statuses}
    )
    assert len(statuses) == 1
    assert statuses[0].id == statuses[0].id


##########################################################
# list_workflow_status_neighbors
##########################################################


async def test_list_workflow_status_neighbors() -> None:
    project = await f.create_project()
    workflow = await sync_to_async(project.workflows.first)()
    statuses = await repositories.list_workflow_statuses(filters={"workflow_id": workflow.id})

    neighbors = await repositories.list_workflow_status_neighbors(
        status=statuses[0], filters={"workflow_id": workflow.id}
    )
    assert neighbors.prev is None
    assert neighbors.next.id == statuses[1].id

    neighbors = await repositories.list_workflow_status_neighbors(
        status=statuses[1], filters={"workflow_id": workflow.id}
    )
    assert neighbors.prev.id == statuses[0].id
    assert neighbors.next.id == statuses[2].id

    neighbors = await repositories.list_workflow_status_neighbors(
        status=statuses[3], filters={"workflow_id": workflow.id}
    )
    assert neighbors.prev.id == statuses[2].id
    assert neighbors.next is None


##########################################################
# get_workflow_status
##########################################################


async def test_get_workflow_status_ok() -> None:
    project = await f.create_project()
    workflows = await _list_workflows(project=project)
    workflow = workflows[0]
    statuses = await _list_workflow_statuses(workflow=workflow)
    status = statuses[0]

    workflow_status = await repositories.get_workflow_status(
        filters={"project_id": project.id, "workflow_slug": workflow.slug, "id": status.id}
    )
    assert workflow_status == status


async def test_get_project_without_workflow_statuses_ok() -> None:
    project = await f.create_project()
    workflows = await _list_workflows(project=project)
    bad_status_id = uuid.uuid1()

    workflow_status = await repositories.get_workflow_status(
        filters={"project_id": project.id, "workflow_slug": workflows[0].slug, "id": bad_status_id}
    )
    assert workflow_status is None


##########################################################
# update_workflow_status
##########################################################


async def test_update_workflow_status_ok() -> None:
    project = await f.create_project()
    workflows = await _list_workflows(project=project)
    workflow = workflows[0]
    statuses = await _list_workflow_statuses(workflow=workflow)
    status = statuses[0]
    new_status_name = "new status name"
    new_values = {"name": new_status_name}

    updated_status = await repositories.update_workflow_status(workflow_status=status, values=new_values)
    assert updated_status.name == new_status_name


async def test_bulk_update_workflow_statuses_ok() -> None:
    project = await f.create_project()
    workflow = await sync_to_async(project.workflows.first)()
    statuses = await repositories.list_workflow_statuses(filters={"workflow_id": workflow.id})

    order = 1
    for status in statuses:
        assert status.order == order
        order += 1

    order = 100
    for status in statuses:
        status.order = order
        order += 1

    await repositories.bulk_update_workflow_statuses(objs_to_update=statuses, fields_to_update=["order"])

    new_statuses = await repositories.list_workflow_statuses(filters={"workflow_id": workflow.id})
    order = 100
    for status in new_statuses:
        assert status.order == order
        order += 1


#########################################################
# delete workflow status
##########################################################


async def test_delete_workflow_status_without_stories_ok() -> None:
    project = await f.create_project()
    workflow = await f.create_workflow(project=project)
    # the workflow status to delete (without containing stories)
    workflow_status = await f.create_workflow_status(workflow=workflow)

    delete_ret = await repositories.delete_workflow_status(filters={"id": workflow_status.id})
    assert delete_ret == 1


async def test_delete_workflow_status_with_stories_ok() -> None:
    project = await f.create_project()
    workflow = await f.create_workflow(project=project)
    # the workflow status to delete
    workflow_status = await f.create_workflow_status(workflow=workflow)
    # its two stories, that should also be deleted
    await f.create_story(status=workflow_status, workflow=workflow)
    await f.create_story(status=workflow_status, workflow=workflow)

    delete_ret = await repositories.delete_workflow_status(filters={"id": workflow_status.id})

    assert delete_ret == 3


##########################################################
# utils
##########################################################


@sync_to_async
def _list_workflows(project: Project) -> list[Workflow]:
    return list(project.workflows.all())


@sync_to_async
def _list_workflow_statuses(workflow: Workflow) -> list[WorkflowStatus]:
    return list(workflow.statuses.all())
