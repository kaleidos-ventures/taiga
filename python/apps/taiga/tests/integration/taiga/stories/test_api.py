# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from asgiref.sync import sync_to_async
from fastapi import status
from tests.utils import factories as f

pytestmark = pytest.mark.django_db(transaction=True)

FULL_PERMISSIONS = {
    "add_task",
    "comment_task",
    "delete_task",
    "modify_task",
    "view_task",
    "add_story",
    "comment_story",
    "delete_story",
    "modify_story",
    "view_story",
}
NO_ADD_STORY_PERMISSIONS = FULL_PERMISSIONS - {"add_story"}
WRONG_SLUG = "wrong_slug"
WRONG_REF = 9999


##########################################################
# GET /projects/<slug>/workflows/<slug>/stories
##########################################################


async def test_list_project_workflow_stories_ok(client):
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)
    workflow = await f.create_workflow(project=project)
    workflow_status = await f.create_workflow_status(workflow=workflow)
    await f.create_story(project=project, workflow=workflow, status=workflow_status)
    await f.create_story(project=project, workflow=workflow, status=workflow_status)

    client.login(pj_admin)
    response = client.get(f"/projects/{project.slug}/workflows/{workflow.slug}/stories")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json()


async def test_list_project_workflow_stories_ok_with_pagination(client):
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)
    workflow = await f.create_workflow(project=project)
    workflow_status = await f.create_workflow_status(workflow=workflow)
    await f.create_story(project=project, workflow=workflow, status=workflow_status)
    await f.create_story(project=project, workflow=workflow, status=workflow_status)

    offset = 0
    limit = 1

    client.login(pj_admin)
    response = client.get(f"/projects/{project.slug}/workflows/{workflow.slug}/stories?offset={offset}&limit={limit}")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json()

    assert len(response.json()) == 1
    assert response.headers["Pagination-Offset"] == "0"
    assert response.headers["Pagination-Limit"] == "1"
    assert response.headers["Pagination-Total"] == "2"


async def test_list_story_invalid_project(client):
    pj_admin = await f.create_user()

    client.login(pj_admin)
    response = client.get(f"/projects/{WRONG_SLUG}/workflows/{WRONG_SLUG}/stories")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_list_story_invalid_workflow(client):
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)

    client.login(pj_admin)
    response = client.get(f"/projects/{project.slug}/workflows/{WRONG_SLUG}/stories")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


##########################################################
# POST /projects/<slug>/workflows/<slug>/stories
##########################################################


async def test_create_story_invalid_project(client):
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)
    workflow = await f.create_workflow(project=project)
    workflow_status = await f.create_workflow_status(workflow=workflow)

    data = {"title": "New story", "status": workflow_status.slug}

    client.login(pj_admin)
    response = client.post(f"/projects/{WRONG_SLUG}/workflows/{workflow.slug}/stories", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_create_story_invalid_workflow(client):
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)
    workflow = await f.create_workflow(project=project)
    workflow_status = await f.create_workflow_status(workflow=workflow)

    data = {"title": "New story", "status": workflow_status.slug}

    client.login(pj_admin)
    response = client.post(f"/projects/{project.slug}/workflows/{WRONG_SLUG}/stories", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_create_story_invalid_status(client):
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)
    workflow = await f.create_workflow(project=project)
    await f.create_workflow_status(workflow=workflow)

    data = {"title": "New story", "status": WRONG_SLUG}

    client.login(pj_admin)
    response = client.post(f"/projects/{project.slug}/workflows/{workflow.slug}/stories", json=data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_create_story_being_ws_or_pj_admin_ok(client):
    ws_owner = await f.create_user()
    pj_owner = await f.create_user()

    workspace = await f.create_workspace(owner=ws_owner)
    project = await f.create_project(workspace=workspace, owner=pj_owner)
    workflow = await f.create_workflow(project=project)
    workflow_status = await f.create_workflow_status(workflow=workflow)

    data = {"title": "New story", "status": workflow_status.slug}

    client.login(ws_owner)
    response = client.post(f"/projects/{project.slug}/workflows/{workflow.slug}/stories", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text

    client.login(pj_owner)
    response = client.post(f"/projects/{project.slug}/workflows/{workflow.slug}/stories", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_create_story_user_has_valid_perm_ok(client):
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

    data = {"title": "New story", "status": workflow_status.slug}

    client.login(ws_member)
    response = client.post(f"/projects/{project.slug}/workflows/{workflow.slug}/stories", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text

    client.login(pj_member)
    response = client.post(f"/projects/{project.slug}/workflows/{workflow.slug}/stories", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text

    client.login(public_user)
    response = client.post(f"/projects/{project.slug}/workflows/{workflow.slug}/stories", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_create_story_user_has_valid_perm_ko(client):
    ws_member = await f.create_user()
    pj_member = await f.create_user()
    public_user = await f.create_user()

    workspace = await f.create_workspace()
    ws_role = await f.create_workspace_role(is_admin=False, workspace=workspace)
    await f.create_workspace_membership(user=ws_member, workspace=workspace, role=ws_role)

    project = await f.create_project(
        workspace=workspace,
        public_permissions=list(NO_ADD_STORY_PERMISSIONS),
        workspace_member_permissions=list(NO_ADD_STORY_PERMISSIONS),
    )
    pj_role = await f.create_project_role(permissions=list(NO_ADD_STORY_PERMISSIONS), is_admin=False, project=project)
    await f.create_project_membership(user=pj_member, project=project, role=pj_role)

    workflow = await f.create_workflow(project=project)
    workflow_status = await f.create_workflow_status(workflow=workflow)

    data = {"title": "New story", "status": workflow_status.slug}

    client.login(ws_member)
    response = client.post(f"/projects/{project.slug}/workflows/{workflow.slug}/stories", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text

    client.login(pj_member)
    response = client.post(f"/projects/{project.slug}/workflows/{workflow.slug}/stories", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text

    client.login(public_user)
    response = client.post(f"/projects/{project.slug}/workflows/{workflow.slug}/stories", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


##########################################################
# POST /projects/<slug>/workflows/<slug>/stories/reorder
##########################################################


async def test_reorder_stories_with_reorder_ok(client):
    pj_admin = await f.create_user()
    pj = await f.create_project(owner=pj_admin)
    workflow = await sync_to_async(pj.workflows.first)()
    status_new = await sync_to_async(workflow.statuses.first)()
    s1 = await f.create_story(project=pj, workflow=workflow, status=status_new)
    await f.create_story(project=pj, workflow=workflow, status=status_new)
    s3 = await f.create_story(project=pj, workflow=workflow, status=status_new)

    data = {"status": "new", "stories": [s1.ref], "reorder": {"place": "before", "ref": s3.ref}}
    client.login(pj_admin)
    response = client.post(f"/projects/{pj.slug}/workflows/main/stories/reorder", json=data)

    assert response.status_code == status.HTTP_200_OK, response.text
    res = response.json()
    assert "status" in res
    assert "reorder" in res
    assert "stories" in res
    assert res["stories"] == [s1.ref]


async def test_reorder_stories_without_reorder_ok(client):
    pj_admin = await f.create_user()
    pj = await f.create_project(owner=pj_admin)
    workflow = await sync_to_async(pj.workflows.first)()
    status_new = await sync_to_async(workflow.statuses.first)()
    s1 = await f.create_story(project=pj, workflow=workflow, status=status_new)
    await f.create_story(project=pj, workflow=workflow, status=status_new)
    await f.create_story(project=pj, workflow=workflow, status=status_new)

    data = {"status": status_new.slug, "stories": [s1.ref]}
    client.login(pj_admin)
    response = client.post(f"/projects/{pj.slug}/workflows/main/stories/reorder", json=data)

    assert response.status_code == status.HTTP_200_OK, response.text
    res = response.json()
    assert "status" in res
    assert "reorder" in res
    assert "stories" in res
    assert res["stories"] == [s1.ref]


##########################################################
# GET /projects/<slug>/stories/<ref>
##########################################################


async def test_get_story_with_neighbors_ok(client):
    pj_admin = await f.create_user()
    project = await f.create_project(owner=pj_admin)
    workflow = await sync_to_async(project.workflows.first)()
    story_status = await sync_to_async(workflow.statuses.first)()
    story = await f.create_story(project=project, workflow=workflow, status=story_status)

    client.login(pj_admin)
    response = client.get(f"/projects/{project.slug}/stories/{story.ref}")
    res = response.json()

    assert response.status_code == status.HTTP_200_OK, response.text
    assert res["ref"] == story.ref


async def test_get_story_invalid_project_slug(client):
    pj_admin = await f.create_user()

    client.login(pj_admin)
    response = client.get(f"/projects/{WRONG_SLUG}/stories/{WRONG_REF}")

    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_get_story_invalid_ref(client):
    pj_admin = await f.create_user()
    pj = await f.create_project(owner=pj_admin)

    client.login(pj_admin)
    response = client.get(f"/projects/{pj.slug}/stories/{WRONG_REF}")

    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text
