# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from fastapi import status
from tests.utils import factories as f

pytestmark = pytest.mark.django_db(transaction=True)

FULL_PERMISSIONS = {
    "add_us",
    "comment_us",
    "delete_us",
    "modify_us",
    "view_us",
    "add_task",
    "comment_task",
    "delete_task",
    "modify_task",
    "view_task",
}
NO_ADD_TASK_PERMISSIONS = FULL_PERMISSIONS - {"add_task"}
WRONG_SLUG = "bad_slug"


##########################################################
# GET /projects/<slug>/workflows/<slug>/tasks
##########################################################


async def test_list_project_workflow_tasks_ok(client):
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)
    workflow = await f.create_workflow(project=project)
    workflow_status = await f.create_workflow_status(workflow=workflow)

    data = {"name": "New task", "status": workflow_status.slug}

    client.login(pj_admin)
    response = client.post(f"/projects/{project.slug}/workflows/{workflow.slug}/tasks", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json()


async def test_list_task_invalid_project(client):
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)
    workflow = await f.create_workflow(project=project)
    workflow_status = await f.create_workflow_status(workflow=workflow)

    data = {"name": "New task", "status": workflow_status.slug}

    client.login(pj_admin)
    response = client.post(f"/projects/{WRONG_SLUG}/workflows/{workflow.slug}/tasks", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_list_task_invalid_workflow(client):
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)
    workflow = await f.create_workflow(project=project)
    workflow_status = await f.create_workflow_status(workflow=workflow)

    data = {"name": "New task", "status": workflow_status.slug}

    client.login(pj_admin)
    response = client.post(f"/projects/{project.slug}/workflows/{WRONG_SLUG}/tasks", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_list_task_invalid_status(client):
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)
    workflow = await f.create_workflow(project=project)
    await f.create_workflow_status(workflow=workflow)

    data = {"name": "New task", "status": WRONG_SLUG}

    client.login(pj_admin)
    response = client.post(f"/projects/{project.slug}/workflows/{workflow.slug}/tasks", json=data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


##########################################################
# POST /projects/<slug>/workflows/<slug>/tasks
##########################################################


async def test_create_task_invalid_project(client):
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)
    workflow = await f.create_workflow(project=project)
    workflow_status = await f.create_workflow_status(workflow=workflow)

    data = {"name": "New task", "status": workflow_status.slug}

    client.login(pj_admin)
    response = client.post(f"/projects/{WRONG_SLUG}/workflows/{workflow.slug}/tasks", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_create_task_invalid_workflow(client):
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)
    workflow = await f.create_workflow(project=project)
    workflow_status = await f.create_workflow_status(workflow=workflow)

    data = {"name": "New task", "status": workflow_status.slug}

    client.login(pj_admin)
    response = client.post(f"/projects/{project.slug}/workflows/{WRONG_SLUG}/tasks", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_create_task_invalid_status(client):
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)
    workflow = await f.create_workflow(project=project)
    await f.create_workflow_status(workflow=workflow)

    data = {"name": "New task", "status": WRONG_SLUG}

    client.login(pj_admin)
    response = client.post(f"/projects/{project.slug}/workflows/{workflow.slug}/tasks", json=data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_create_task_being_ws_or_pj_admin_ok(client):
    ws_owner = await f.create_user()
    pj_owner = await f.create_user()

    workspace = await f.create_workspace(owner=ws_owner)
    project = await f.create_project(workspace=workspace, owner=pj_owner)
    workflow = await f.create_workflow(project=project)
    workflow_status = await f.create_workflow_status(workflow=workflow)

    data = {"name": "New task", "status": workflow_status.slug}

    client.login(ws_owner)
    response = client.post(f"/projects/{project.slug}/workflows/{workflow.slug}/tasks", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text

    client.login(pj_owner)
    response = client.post(f"/projects/{project.slug}/workflows/{workflow.slug}/tasks", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_create_task_user_has_valid_perm_ok(client):
    ws_member = await f.create_user()
    pj_member = await f.create_user()
    public_user = await f.create_user()

    workspace = await f.create_workspace()
    ws_role = await f.create_workspace_role(is_admin=False, workspace=workspace)
    await f.create_workspace_membership(user=ws_member, workspace=workspace, role=ws_role)

    project = await f.create_project(
        workspace=workspace,
        public_permissions=list(FULL_PERMISSIONS),
        workspace_member_permissions=list(FULL_PERMISSIONS),
    )
    pj_role = await f.create_project_role(permissions=list(FULL_PERMISSIONS), is_admin=False, project=project)
    await f.create_project_membership(user=pj_member, project=project, role=pj_role)

    workflow = await f.create_workflow(project=project)
    workflow_status = await f.create_workflow_status(workflow=workflow)

    data = {"name": "New task", "status": workflow_status.slug}

    client.login(ws_member)
    response = client.post(f"/projects/{project.slug}/workflows/{workflow.slug}/tasks", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text

    client.login(pj_member)
    response = client.post(f"/projects/{project.slug}/workflows/{workflow.slug}/tasks", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text

    client.login(public_user)
    response = client.post(f"/projects/{project.slug}/workflows/{workflow.slug}/tasks", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_create_task_user_has_valid_perm_ko(client):
    ws_member = await f.create_user()
    pj_member = await f.create_user()
    public_user = await f.create_user()

    workspace = await f.create_workspace()
    ws_role = await f.create_workspace_role(is_admin=False, workspace=workspace)
    await f.create_workspace_membership(user=ws_member, workspace=workspace, role=ws_role)

    project = await f.create_project(
        workspace=workspace,
        public_permissions=list(NO_ADD_TASK_PERMISSIONS),
        workspace_member_permissions=list(NO_ADD_TASK_PERMISSIONS),
    )
    pj_role = await f.create_project_role(permissions=list(NO_ADD_TASK_PERMISSIONS), is_admin=False, project=project)
    await f.create_project_membership(user=pj_member, project=project, role=pj_role)

    workflow = await f.create_workflow(project=project)
    workflow_status = await f.create_workflow_status(workflow=workflow)

    data = {"name": "New task", "status": workflow_status.slug}

    client.login(ws_member)
    response = client.post(f"/projects/{project.slug}/workflows/{workflow.slug}/tasks", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text

    client.login(pj_member)
    response = client.post(f"/projects/{project.slug}/workflows/{workflow.slug}/tasks", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text

    client.login(public_user)
    response = client.post(f"/projects/{project.slug}/workflows/{workflow.slug}/tasks", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text
