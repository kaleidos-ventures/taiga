# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


import pytest
from asgiref.sync import sync_to_async
from fastapi import status
from tests.utils import factories as f

pytestmark = pytest.mark.django_db

WRONG_SLUG = "wrong_slug"
WRONG_ID = "WrongID"


##########################################################
# Workflow GET /projects/<pj_b64id>/workflows
##########################################################


async def test_get_workflows(client):
    project = await f.create_project()

    client.login(project.created_by)
    response = client.get(f"/projects/{project.b64id}/workflows")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_workflows_wrong_id(client):
    user = await f.create_user()
    non_existent_id = "xxxxxxxxxxxxxxxxxxxxxx"
    client.login(user)
    response = client.get(f"/projects/{non_existent_id}/workflows")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_get_workflows_wrong_permissions(client):
    project = await f.create_project()
    user = await f.create_user()

    client.login(user)
    response = client.get(f"/projects/{project.b64id}/workflows")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


#################################################################
# Workflow GET /projects/<pj_b64id>/workflows/{wf_slug}
#################################################################


async def test_get_workflow(client):
    project = await f.create_project()
    workflow = await f.create_workflow(project=project)

    client.login(project.created_by)
    response = client.get(f"/projects/{project.b64id}/workflows/{workflow.slug}")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_workflow_wrong_project_slug(client):
    project = await f.create_project()
    workflow = await f.create_workflow(project=project)

    client.login(project.created_by)
    response = client.get(f"/projects/WRONG_PJ_SLUG/workflows/{workflow.slug}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_get_workflow_wrong_workflow_slug(client):
    project = await f.create_project()

    client.login(project.created_by)
    response = client.get(f"/projects/{project.b64id}/workflows/WRONG_W_SLUG")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_get_workflow_wrong_permissions(client):
    project = await f.create_project()
    workflow = await f.create_workflow(project=project)
    user = await f.create_user()

    client.login(user)
    response = client.get(f"/projects/{project.b64id}/workflows/{workflow.slug}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


################################################################################
# WorkflowStatus POST /projects/<pj_b64id>/workflows/<wf_slug>/statuses
################################################################################


async def test_create_workflow_status_invalid_workflow(client):
    project = await f.create_project()
    await f.create_workflow(project=project)

    data = {"name": "Closed", "color": 5}

    client.login(project.created_by)
    response = client.post(f"/projects/{project.b64id}/workflows/{WRONG_SLUG}/statuses", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_create_workflow_status_being_pj_admin_ok(client):
    project = await f.create_project()
    workflow = await f.create_workflow(project=project)

    data = {"name": "Closed", "color": 5}

    client.login(project.created_by)
    response = client.post(f"/projects/{project.b64id}/workflows/{workflow.slug}/statuses", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_create_workflow_status_forbidden(client):
    pj_member = await f.create_user()
    project = await f.create_project()
    pj_role = await f.create_project_role(is_admin=False, project=project)
    await f.create_project_membership(user=pj_member, project=project, role=pj_role)

    workflow = await f.create_workflow(project=project)

    data = {"name": "Closed", "color": 5}

    client.login(pj_member)
    response = client.post(f"/projects/{project.b64id}/workflows/{workflow.slug}/statuses", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


################################################################################
# WorkflowStatus PATCH /projects/<pj_b64id>/workflows/<wf_slug>/statuses/<wf_status_b64id>
################################################################################


async def test_200_update_status_ok(client):
    project = await f.create_project()
    workflow = await f.create_workflow(project=project)
    wf_status = await f.create_workflow_status(workflow=workflow)

    data = {"name": "New status name"}

    client.login(project.created_by)
    response = client.patch(
        f"/projects/{project.b64id}/workflows/{workflow.slug}/statuses/{wf_status.b64id}", json=data
    )
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_404_update_status_invalid_workflow_status(client):
    project = await f.create_project()
    workflow = await f.create_workflow(project=project)

    data = {"name": "New status name"}

    client.login(project.created_by)
    response = client.patch(f"/projects/{project.b64id}/workflows/{workflow.slug}/statuses/{WRONG_ID}", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text
    assert "Workflow status" in response.text


async def test_400_update_status_null_name(client):
    project = await f.create_project()
    workflow = await f.create_workflow(project=project)
    wf_status = await f.create_workflow_status(workflow=workflow)

    data = {"name": None}

    client.login(project.created_by)
    response = client.patch(
        f"/projects/{project.b64id}/workflows/{workflow.slug}/statuses/{wf_status.b64id}", json=data
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text
    assert response.json()["error"]["msg"] == "Name cannot be null"


##########################################################
# Workflow Status POST /projects/<slug>/workflows/<slug>/statuses/reorder
##########################################################


async def test_reorder_statuses_with_reorder_ok(client):
    pj = await f.create_project()
    workflow = await sync_to_async(pj.workflows.first)()
    wf_status = await sync_to_async(workflow.statuses.first)()
    reorder_status = await sync_to_async(workflow.statuses.last)()

    data = {"statuses": [wf_status.b64id], "reorder": {"place": "before", "status": reorder_status.b64id}}
    client.login(pj.created_by)
    response = client.post(f"/projects/{pj.b64id}/workflows/main/statuses/reorder", json=data)

    assert response.status_code == status.HTTP_200_OK, response.text
    res = response.json()
    assert "reorder" in res
    assert "statuses" in res
    assert res["statuses"] == [wf_status.b64id]


################################################################################
# WorkflowStatus DELETE /projects/<pj_b64id>/workflows/<wf_slug>/statuses/<ws_slug>
################################################################################


async def test_200_delete_workflow_status_ok(client):
    project = await f.create_project()
    wf = await f.create_workflow(project=project)
    wf_status1 = await f.create_workflow_status(workflow=wf)
    wf_status2 = await f.create_workflow_status(workflow=wf)
    await f.create_story(status=wf_status1, workflow=wf)

    client.login(project.created_by)
    response = client.delete(
        f"/projects/{project.b64id}/workflows/{wf.slug}/statuses/{wf_status1.b64id}?moveTo={wf_status2.b64id}"
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT, response.text


@pytest.mark.parametrize("project_b64id", [None, WRONG_ID])
async def test_404_delete_invalid_project(client, project_b64id):
    project = await f.create_project()
    wf = await f.create_workflow(project=project)
    wf_status1 = await f.create_workflow_status(workflow=wf)
    client.login(project.created_by)
    response = client.delete(f"/projects/{project_b64id}/workflows/{wf.slug}/statuses/{wf_status1.b64id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


@pytest.mark.parametrize("workflow_slug", [None, WRONG_SLUG])
async def test_404_delete_invalid_workflow(client, workflow_slug):
    project = await f.create_project()
    wf = await f.create_workflow(project=project)
    wf_status1 = await f.create_workflow_status(workflow=wf)
    client.login(project.created_by)
    response = client.delete(f"/projects/{project.b64id}/workflows/{workflow_slug}/statuses/{wf_status1.b64id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


@pytest.mark.parametrize("wf_status_b64id", [None, WRONG_ID])
async def test_404_delete_invalid_workflow_status(client, wf_status_b64id):
    project = await f.create_project()
    wf = await f.create_workflow(project=project)
    client.login(project.created_by)
    response = client.delete(f"/projects/{project.b64id}/workflows/{wf.slug}/statuses/{wf_status_b64id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


@pytest.mark.parametrize("move_to_wf_status_b64id", [None, WRONG_ID])
async def test_422_invalid_move_to_workflow_status(client, move_to_wf_status_b64id):
    project = await f.create_project()
    wf = await f.create_workflow(project=project)
    wf_status1 = await f.create_workflow_status(workflow=wf)
    await f.create_story(status=wf_status1, workflow=wf)
    client.login(project.created_by)
    response = client.delete(
        f"/projects/{project.b64id}/workflows/{wf.slug}/statuses/{wf_status1.b64id}?moveTo={move_to_wf_status_b64id}"
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


async def test_403_delete_workflow_status_not_project_admin(client):
    project = await f.create_project()
    wf = await f.create_workflow(project=project)
    wf_status = await f.create_workflow_status(workflow=wf)
    another_user = await f.create_user()

    client.login(another_user)
    response = client.delete(f"/projects/{project.b64id}/workflows/{wf.slug}/statuses/{wf_status.b64id}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text
