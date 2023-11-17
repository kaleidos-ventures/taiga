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
from tests.utils.bad_params import INVALID_B64ID, INVALID_REF, NOT_EXISTING_B64ID, NOT_EXISTING_REF, NOT_EXISTING_SLUG

pytestmark = pytest.mark.django_db(transaction=True)

FULL_PERMISSIONS = {
    "add_story",
    "comment_story",
    "delete_story",
    "modify_story",
    "view_story",
}
NO_ADD_STORY_PERMISSIONS = FULL_PERMISSIONS - {"add_story"}


##########################################################
# POST /projects/<slug>/workflows/<slug>/stories
##########################################################


async def test_create_story_200_ok_being_ws_or_pj_admin_ok(client):
    workspace = await f.create_workspace()
    project = await f.create_project(workspace=workspace)
    workflow = await f.create_workflow(project=project)
    workflow_status = await f.create_workflow_status(workflow=workflow)

    data = {"title": "New story", "description": "Story description", "status": workflow_status.b64id}

    client.login(workspace.created_by)
    response = client.post(f"/projects/{project.b64id}/workflows/{workflow.slug}/stories", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text

    client.login(project.created_by)
    response = client.post(f"/projects/{project.b64id}/workflows/{workflow.slug}/stories", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_create_story_200_ok_user_has_valid_perm_ok(client):
    ws_member = await f.create_user()
    pj_member = await f.create_user()
    public_user = await f.create_user()

    workspace = await f.create_workspace()
    await f.create_workspace_membership(user=ws_member, workspace=workspace)

    project = await f.create_project(
        workspace=workspace,
        public_permissions=list(FULL_PERMISSIONS),
    )
    pj_role = await f.create_project_role(permissions=list(FULL_PERMISSIONS), is_admin=False, project=project)
    await f.create_project_membership(user=pj_member, project=project, role=pj_role)

    workflow = await f.create_workflow(project=project)
    workflow_status = await f.create_workflow_status(workflow=workflow)

    data = {"title": "New story", "description": "Story description", "status": workflow_status.b64id}

    client.login(ws_member)
    response = client.post(f"/projects/{project.b64id}/workflows/{workflow.slug}/stories", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text

    client.login(pj_member)
    response = client.post(f"/projects/{project.b64id}/workflows/{workflow.slug}/stories", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text

    client.login(public_user)
    response = client.post(f"/projects/{project.b64id}/workflows/{workflow.slug}/stories", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_create_story_400_bad_request_invalid_status(client):
    project = await f.create_project()
    workflow = await f.create_workflow(project=project)
    await f.create_workflow_status(workflow=workflow)

    data = {"title": "New story", "status": NOT_EXISTING_B64ID}

    client.login(project.created_by)
    response = client.post(f"/projects/{project.b64id}/workflows/{workflow.slug}/stories", json=data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_create_story_403_forbidden_user_has_not_valid_perm(client):
    ws_member = await f.create_user()
    pj_member = await f.create_user()
    public_user = await f.create_user()

    workspace = await f.create_workspace()
    await f.create_workspace_membership(user=ws_member, workspace=workspace)

    project = await f.create_project(
        workspace=workspace,
        public_permissions=list(NO_ADD_STORY_PERMISSIONS),
    )
    pj_role = await f.create_project_role(permissions=list(NO_ADD_STORY_PERMISSIONS), is_admin=False, project=project)
    await f.create_project_membership(user=pj_member, project=project, role=pj_role)

    workflow = await f.create_workflow(project=project)
    workflow_status = await f.create_workflow_status(workflow=workflow)

    data = {"title": "New story", "status": workflow_status.b64id}

    client.login(pj_member)
    response = client.post(f"/projects/{project.b64id}/workflows/{workflow.slug}/stories", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text

    client.login(public_user)
    response = client.post(f"/projects/{project.b64id}/workflows/{workflow.slug}/stories", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_create_story_404_project_b64_id(client):
    project = await f.create_project()
    workflow = await f.create_workflow(project=project)
    workflow_status = await f.create_workflow_status(workflow=workflow)

    data = {"title": "New story", "status": workflow_status.b64id}

    client.login(project.created_by)
    response = client.post(f"/projects/{NOT_EXISTING_B64ID}/workflows/{workflow.slug}/stories", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_create_story_404_not_found_workflow_slug(client):
    project = await f.create_project()
    workflow = await f.create_workflow(project=project)
    workflow_status = await f.create_workflow_status(workflow=workflow)

    data = {"title": "New story", "status": workflow_status.b64id}

    client.login(project.created_by)
    response = client.post(f"/projects/{project.b64id}/workflows/{NOT_EXISTING_SLUG}/stories", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_create_story_422_unprocessable_project_b64_id(client):
    project = await f.create_project()
    workflow = await f.create_workflow(project=project)
    workflow_status = await f.create_workflow_status(workflow=workflow)

    data = {"title": "New story", "status": workflow_status.b64id}

    client.login(project.created_by)
    response = client.post(f"/projects/{INVALID_B64ID}/workflows/{workflow.slug}/stories", json=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


##########################################################
# GET /projects/<slug>/workflows/<slug>/stories
##########################################################


async def test_list_workflow_stories_200_ok(client):
    project = await f.create_project()
    workflow = await f.create_workflow(project=project)
    workflow_status = await f.create_workflow_status(workflow=workflow)
    await f.create_story(project=project, workflow=workflow, status=workflow_status)
    await f.create_story(project=project, workflow=workflow, status=workflow_status)

    client.login(project.created_by)
    response = client.get(f"/projects/{project.b64id}/workflows/{workflow.slug}/stories")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json()


async def test_list_workflow_stories_200_ok_with_pagination(client):
    project = await f.create_project()
    workflow = await f.create_workflow(project=project)
    workflow_status = await f.create_workflow_status(workflow=workflow)
    await f.create_story(project=project, workflow=workflow, status=workflow_status)
    await f.create_story(project=project, workflow=workflow, status=workflow_status)

    offset = 0
    limit = 1

    client.login(project.created_by)
    response = client.get(f"/projects/{project.b64id}/workflows/{workflow.slug}/stories?offset={offset}&limit={limit}")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json()

    assert len(response.json()) == 1
    assert response.headers["Pagination-Offset"] == "0"
    assert response.headers["Pagination-Limit"] == "1"
    assert response.headers["Pagination-Total"] == "2"


async def test_list_workflow_stories_404_not_found_project_b64id(client):
    workflow = await f.create_workflow()
    pj_admin = await f.create_user()

    client.login(pj_admin)
    response = client.get(f"/projects/{NOT_EXISTING_B64ID}/workflows/{workflow.slug}/stories")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_list_workflow_stories_404_not_found_workflow_slug(client):
    project = await f.create_project()
    pj_admin = await f.create_user()

    client.login(pj_admin)
    response = client.get(f"/projects/{project.b64id}/workflows/{NOT_EXISTING_SLUG}/stories")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_list_workflow_stories_422_unprocessable_project_b64id(client):
    workflow = await f.create_workflow()
    pj_admin = await f.create_user()

    client.login(pj_admin)
    response = client.get(f"/projects/{INVALID_B64ID}/workflows/{workflow.slug}/stories")
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


async def test_list_story_invalid_workflow(client):
    project = await f.create_project()

    client.login(project.created_by)
    response = client.get(f"/projects/{project.b64id}/workflows/{NOT_EXISTING_SLUG}/stories")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


##########################################################
# GET /projects/<slug>/stories/<ref>
##########################################################


async def test_get_story_200_ok(client):
    project = await f.create_project()
    workflow = await sync_to_async(project.workflows.first)()
    story_status = await sync_to_async(workflow.statuses.first)()
    story = await f.create_story(project=project, workflow=workflow, status=story_status)

    client.login(project.created_by)
    response = client.get(f"/projects/{project.b64id}/stories/{story.ref}")
    res = response.json()

    assert response.status_code == status.HTTP_200_OK, response.text
    assert res["ref"] == story.ref


async def test_get_story_404_not_found_project_b64id(client):
    project = await f.create_project()
    story = await f.create_story(project=project)

    client.login(project.created_by)
    response = client.get(f"/projects/{NOT_EXISTING_B64ID}/stories/{story.ref}")

    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_get_story_404_not_found_story_ref(client):
    project = await f.create_project()

    client.login(project.created_by)
    response = client.get(f"/projects/{project.b64id}/stories/{NOT_EXISTING_REF}")

    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_get_story_422_unprocessable_project_b64id(client):
    pj_admin = await f.create_user()

    client.login(pj_admin)
    response = client.get(f"/projects/{INVALID_B64ID}/stories/{NOT_EXISTING_B64ID}")

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


async def test_get_story_422_unprocessable_story_ref(client):
    project = await f.create_project()

    client.login(project.created_by)
    response = client.get(f"/projects/{project.b64id}/stories/{INVALID_REF}")

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


##########################################################
# PATCH /projects/<slug>/stories/<ref>
##########################################################


async def test_update_story_200_ok_unprotected_attribute_status_ok(client):
    project = await f.create_project()
    workflow = await project.workflows.afirst()
    status1 = await workflow.statuses.afirst()
    status2 = await workflow.statuses.alast()
    story = await f.create_story(project=project, workflow=workflow, status=status1)

    data = {"version": story.version, "status": status2.b64id}
    client.login(project.created_by)
    response = client.patch(f"/projects/{project.b64id}/stories/{story.ref}", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_update_story_200_ok_unprotected_attribute_workflow_ok(client):
    project = await f.create_project()
    workflow1 = await project.workflows.afirst()
    status1 = await workflow1.statuses.afirst()
    workflow2 = await f.create_workflow(project=project)
    story = await f.create_story(project=project, workflow=workflow1, status=status1)

    data = {"version": story.version, "workflow": workflow2.slug}
    client.login(project.created_by)
    response = client.patch(f"/projects/{project.b64id}/stories/{story.ref}", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_update_story_200_ok_protected_attribute_ok(client):
    project = await f.create_project()
    workflow = await project.workflows.afirst()
    status1 = await workflow.statuses.afirst()
    story = await f.create_story(project=project, workflow=workflow, status=status1)

    data = {"version": story.version, "title": "title updated", "description": "description updated"}
    client.login(project.created_by)
    response = client.patch(f"/projects/{project.b64id}/stories/{story.ref}", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_update_story_protected_400_bad_request_attribute_error_with_invalid_version(client):
    project = await f.create_project()
    workflow = await project.workflows.afirst()
    status1 = await workflow.statuses.afirst()
    story = await f.create_story(project=project, workflow=workflow, status=status1, version=2)

    data = {"version": story.version - 1, "title": "new title"}
    client.login(project.created_by)
    response = client.patch(f"/projects/{project.b64id}/stories/{story.ref}", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_update_story_422_unprocessable_project_b64id(client):
    project = await f.create_project()
    story = await f.create_story(project=project)

    data = {"version": 1, "title": "new title"}
    client.login(project.created_by)
    response = client.patch(f"/projects/{INVALID_B64ID}/stories/{story.ref}", json=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


async def test_update_story_422_unprocessable_story_ref(client):
    project = await f.create_project()

    data = {"version": 1, "title": "new title"}
    client.login(project.created_by)
    response = client.patch(f"/projects/{project.b64id}/stories/{INVALID_REF}", json=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


async def test_update_story_422_unprocessable_both_workflow_and_status(client):
    project = await f.create_project()

    data = {"version": 1, "workflow": "workflow-slug", "status": project.b64id}
    client.login(project.created_by)
    response = client.patch(f"/projects/{project.b64id}/stories/1", json=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


async def test_update_story_404_not_found_project_b64id(client):
    project = await f.create_project()
    story = await f.create_story(project=project)

    data = {"version": 1, "title": "new title"}
    client.login(project.created_by)
    response = client.patch(f"/projects/{NOT_EXISTING_B64ID}/stories/{story.ref}", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_update_story_404_not_found_story_ref(client):
    project = await f.create_project()

    data = {"version": 1, "title": "new title"}
    client.login(project.created_by)
    response = client.patch(f"/projects/{project.b64id}/stories/{NOT_EXISTING_REF}", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


##########################################################
# POST /projects/<slug>/workflows/<slug>/stories/reorder
##########################################################


async def test_reorder_stories_with_reorder_ok(client):
    project = await f.create_project()
    workflow = await sync_to_async(project.workflows.first)()
    status_new = await sync_to_async(workflow.statuses.first)()
    s1 = await f.create_story(project=project, workflow=workflow, status=status_new)
    await f.create_story(project=project, workflow=workflow, status=status_new)
    s3 = await f.create_story(project=project, workflow=workflow, status=status_new)

    data = {"status": status_new.b64id, "stories": [s1.ref], "reorder": {"place": "before", "ref": s3.ref}}
    client.login(project.created_by)
    response = client.post(f"/projects/{project.b64id}/workflows/main/stories/reorder", json=data)

    assert response.status_code == status.HTTP_200_OK, response.text
    res = response.json()
    assert "status" in res
    assert "reorder" in res
    assert "stories" in res
    assert res["stories"] == [s1.ref]


async def test_reorder_stories_without_reorder_ok(client):
    project = await f.create_project()
    workflow = await sync_to_async(project.workflows.first)()
    status_new = await sync_to_async(workflow.statuses.first)()
    s1 = await f.create_story(project=project, workflow=workflow, status=status_new)
    await f.create_story(project=project, workflow=workflow, status=status_new)
    await f.create_story(project=project, workflow=workflow, status=status_new)

    data = {"status": status_new.b64id, "stories": [s1.ref]}
    client.login(project.created_by)
    response = client.post(f"/projects/{project.b64id}/workflows/main/stories/reorder", json=data)

    assert response.status_code == status.HTTP_200_OK, response.text
    res = response.json()
    assert "status" in res
    assert "reorder" in res
    assert "stories" in res
    assert res["stories"] == [s1.ref]


##########################################################
# DELETE /projects/<slug>/stories/<ref>
##########################################################


async def test_delete_204_no_content_story(client):
    project = await f.create_project()
    story = await f.create_story(project=project)

    client.login(project.created_by)
    response = client.delete(f"/projects/{project.b64id}/stories/{story.ref}")
    assert response.status_code == status.HTTP_204_NO_CONTENT, response.text


async def test_delete_story_403_forbidden_user_without_permissions(client):
    project = await f.create_project()
    story = await f.create_story(project=project)
    user = await f.create_user()

    client.login(user)
    response = client.delete(f"/projects/{project.b64id}/stories/{story.ref}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_delete_story_404_not_found_project_b64id(client):
    project = await f.create_project()
    story = await f.create_story(project=project)

    client.login(project.created_by)
    response = client.delete(f"/projects/{NOT_EXISTING_B64ID}/stories/{story.ref}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_delete_story_404_not_found_story_ref(client):
    project = await f.create_project()

    client.login(project.created_by)
    response = client.delete(f"/projects/{project.b64id}/stories/{NOT_EXISTING_REF}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_delete_story_422_unprocessable_project_b64id(client):
    project = await f.create_project()

    client.login(project.created_by)
    response = client.delete(f"/projects/{project.b64id}/stories/{INVALID_B64ID}")
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


async def test_delete_story_422_unprocessable_story_ref(client):
    project = await f.create_project()

    client.login(project.created_by)
    response = client.delete(f"/projects/{project.b64id}/stories/{INVALID_REF}")
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text
