# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from fastapi import status
from taiga.permissions import choices
from tests.utils import factories as f
from tests.utils.bad_params import INVALID_B64ID, NOT_EXISTING_B64ID

pytestmark = pytest.mark.django_db(transaction=True)


##########################################################
# POST /projects
##########################################################


async def test_create_project_200_ok_being_workspace_member(client):
    workspace = await f.create_workspace()
    data = {"name": "Project test", "color": 1, "workspaceId": workspace.b64id}
    files = {"logo": ("logo.png", f.build_image_file("logo"), "image/png")}

    client.login(workspace.created_by)
    response = client.post("/projects", data=data, files=files)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_create_project_400_bad_request_invalid_workspace_error(client):
    workspace = await f.create_workspace()
    non_existing_uuid = "6JgsbGyoEe2VExhWgGrI2w"
    data = {"name": "My pro#%&乕شject", "color": 1, "workspaceId": non_existing_uuid}

    client.login(workspace.created_by)
    response = client.post("/projects", data=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_create_project_403_being_no_workspace_member(client):
    workspace = await f.create_workspace()
    user2 = await f.create_user()
    data = {"name": "Project test", "color": 1, "workspaceId": workspace.b64id}
    files = {"logo": ("logo.png", f.build_image_file("logo"), "image/png")}

    client.login(user2)
    response = client.post("/projects", data=data, files=files)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_create_project_403_being_anonymous(client):
    workspace = await f.create_workspace()
    data = {"name": "Project test", "color": 1, "workspaceId": workspace.b64id}
    files = {"logo": ("logo.png", f.build_image_file("logo"), "image/png")}

    response = client.post("/projects", data=data, files=files)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_create_project_422_unprocessable_color(client):
    workspace = await f.create_workspace()
    data = {"name": "My project", "color": 12, "workspaceId": workspace.b64id}

    client.login(workspace.created_by)
    response = client.post("/projects", data=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


##########################################################
# GET /workspaces/<id>/projects
##########################################################


async def test_list_workspace_projects_200_ok(client):
    workspace = await f.create_workspace()
    await f.create_project(workspace=workspace, created_by=workspace.created_by)

    client.login(workspace.created_by)
    response = client.get(f"/workspaces/{workspace.b64id}/projects")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1


async def test_list_workspace_projects_404_not_found_workspace_b64id(client):
    user = await f.create_user()
    client.login(user)
    response = client.get(f"/workspaces/{NOT_EXISTING_B64ID}/projects")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_list_workspace_projects_422_unprocessable_workspace_b64id(client):
    user = await f.create_user()
    client.login(user)
    response = client.get(f"/workspaces/{INVALID_B64ID}/projects")
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


##########################################################
# GET /workspaces/<id>/invited-projects
##########################################################


async def test_list_workspace_invited_projects_200_ok(client):
    workspace = await f.create_workspace()
    project = await f.create_project(workspace=workspace, created_by=workspace.created_by)
    user2 = await f.create_user()
    await f.create_workspace_membership(user=user2, workspace=workspace)
    await f.create_project_invitation(email=user2.email, user=user2, project=project, invited_by=workspace.created_by)

    client.login(user2)
    response = client.get(f"/workspaces/{workspace.b64id}/invited-projects")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1


async def test_list_workspace_invited_projects_404_not_found_workspace_b64id(client):
    user = await f.create_user()
    client.login(user)
    response = client.get(f"/workspaces/{NOT_EXISTING_B64ID}/invited-projects")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_list_workspace_invited_projects_422_unproccessable_workspace_b64id(client):
    user = await f.create_user()
    client.login(user)
    response = client.get(f"/workspaces/{INVALID_B64ID}/invited-projects")
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


##########################################################
# GET /projects/<id>
##########################################################


async def test_get_project_200_ok_being_project_admin(client):
    project = await f.create_project()

    client.login(project.created_by)
    response = client.get(f"/projects/{project.b64id}")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_project_200_ok_being_project_member(client):
    project = await f.create_project()
    general_member_role = await f.create_project_role(
        permissions=choices.ProjectPermissions.values,
        is_admin=False,
        project=project,
    )

    user2 = await f.create_user()
    await f.create_project_membership(user=user2, project=project, role=general_member_role)

    client.login(user2)
    response = client.get(f"/projects/{project.b64id}")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_project_200_ok_being_invited_user(client):
    project = await f.create_project()
    general_member_role = await f.create_project_role(
        permissions=choices.ProjectPermissions.values,
        is_admin=False,
        project=project,
    )

    user2 = await f.create_user()
    await f.create_project_invitation(user=user2, project=project, role=general_member_role)

    client.login(user2)
    response = client.get(f"/projects/{project.b64id}")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_project_403_forbidden_not_project_member(client):
    project = await f.create_project()
    user2 = await f.create_user()

    client.login(user2)
    response = client.get(f"/projects/{project.b64id}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_get_project_403_forbidden_being_anonymous(client):
    project = await f.create_project()

    response = client.get(f"/projects/{project.b64id}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_get_project_404_not_found_project_b64id(client):
    user = await f.create_user()
    client.login(user)
    response = client.get(f"/projects/{NOT_EXISTING_B64ID}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_get_project_422_unprocessable_project_b64id(client):
    user = await f.create_user()
    client.login(user)
    response = client.get(f"/projects/{INVALID_B64ID}")
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


##########################################################
# GET /projects/<id>/public-permissions
##########################################################


async def test_get_project_public_permissions_200_ok(client):
    project = await f.create_project()

    client.login(project.created_by)
    response = client.get(f"/projects/{project.b64id}/public-permissions")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_project_public_permissions_403_forbidden_no_admin(client):
    project = await f.create_project()
    user2 = await f.create_user()

    client.login(user2)
    response = client.get(f"/projects/{project.b64id}/public-permissions")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_get_project_public_permissions_403_forbidden_no_member(client):
    project = await f.create_project()
    user = await f.create_user()

    client.login(user)
    response = client.get(f"/projects/{project.b64id}/public-permissions")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_get_project_public_permissions_403_forbidden_anonymous_user(client):
    project = await f.create_project()

    response = client.get(f"/projects/{project.b64id}/public-permissions")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_get_project_public_permissions_404_not_found_project_b64id(client):
    user = await f.create_user()
    client.login(user)
    response = client.get(f"/projects/{NOT_EXISTING_B64ID}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_get_project_public_permissions_422_unprocessable_project_b64id(client):
    user = await f.create_user()
    client.login(user)
    response = client.get(f"/projects/{INVALID_B64ID}")
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


##########################################################
# PATCH /projects/<id>/
##########################################################


async def test_update_project_200_ok(client):
    project = await f.create_project()

    data = {"name": "New name", "description": "new description"}
    files = {"logo": ("new-logo.png", f.build_image_file("new-logo"), "image/png")}

    client.login(project.created_by)
    response = client.patch(f"/projects/{project.b64id}", data=data, files=files)
    assert response.status_code == status.HTTP_200_OK, response.text
    updated_project = response.json()
    assert updated_project["name"] == "New name"
    assert updated_project["description"] == "new description"
    assert "new-logo.png" in updated_project["logo"]


async def test_update_project_200_ok_delete_description(client):
    project = await f.create_project()

    data = {"description": ""}

    client.login(project.created_by)
    response = client.patch(f"/projects/{project.b64id}", data=data)
    assert response.status_code == status.HTTP_200_OK, response.text
    updated_project = response.json()
    assert updated_project["name"] == project.name
    assert updated_project["description"] == ""


async def test_update_project_403_forbidden_no_admin(client):
    other_user = await f.create_user()
    project = await f.create_project()

    data = {"name": "new name"}
    client.login(other_user)
    response = client.patch(f"/projects/{project.b64id}", data=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_update_project_404_not_found_project_b64id(client):
    user = await f.create_user()
    data = {"name": "new name"}

    client.login(user)
    response = client.patch(f"/projects/{NOT_EXISTING_B64ID}", data=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_update_project_422_unprocessable_project_b64id(client):
    user = await f.create_user()
    data = {"name": "new name"}

    client.login(user)
    response = client.patch(f"/projects/{INVALID_B64ID}", data=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


##########################################################
# PUT /projects/<id>/public-permissions
##########################################################


@pytest.mark.parametrize(
    "permissions",
    [
        (["view_story"]),
        (["view_story", "modify_story"]),
    ],
)
async def test_update_project_public_permissions_200_ok(client, permissions):
    project = await f.create_project()
    data = {"permissions": permissions}

    client.login(project.created_by)
    response = client.put(f"/projects/{project.b64id}/public-permissions", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_update_project_public_permissions_403_forbidden_no_admin(client):
    project = await f.create_project()
    user2 = await f.create_user()
    data = {"permissions": []}

    client.login(user2)
    response = client.put(f"/projects/{project.b64id}/public-permissions", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_update_project_public_permissions_403_forbidden_no_member(client):
    project = await f.create_project()
    user = await f.create_user()
    data = {"permissions": []}

    client.login(user)
    response = client.put(f"/projects/{project.b64id}/public-permissions", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_update_project_public_permissions_403_forbidden_anonymous_user(client):
    project = await f.create_project()
    data = {"permissions": []}

    response = client.put(f"/projects/{project.b64id}/public-permissions", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_update_project_public_permissions_404_not_found_project_b64id(client):
    user = await f.create_user()
    data = {"permissions": ["view_story"]}

    client.login(user)
    response = client.put(f"/projects/{NOT_EXISTING_B64ID}/public-permissions", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


@pytest.mark.parametrize(
    "permissions",
    [
        (["modify_story"]),
        (["delete_story"]),
    ],
)
async def test_update_project_public_permissions_422_unprocessable_incompatible(client, permissions):
    project = await f.create_project()
    data = {"permissions": permissions}

    client.login(project.created_by)
    response = client.put(f"/projects/{project.b64id}/public-permissions", json=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


async def test_update_project_public_permissions_422_unprocessable_not_valid(client):
    project = await f.create_project()
    data = {"permissions": ["not_valid"]}

    client.login(project.created_by)
    response = client.put(f"/projects/{project.b64id}/public-permissions", json=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


async def test_update_project_public_permissions_422_unprocessable_project_b64id(client):
    data = {"permissions": []}

    response = client.put(f"/projects/{INVALID_B64ID}/public-permissions", json=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


##########################################################
# DELETE /projects/<id>
##########################################################


async def test_delete_project_204_no_content_being_proj_admin(client):
    project = await f.create_project()

    client.login(project.created_by)
    response = client.delete(f"/projects/{project.b64id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT, response.text


async def test_delete_project_204_no_content_being_ws_admin(client):
    ws = await f.create_workspace()
    project = await f.create_project(workspace=ws)

    client.login(ws.created_by)
    response = client.delete(f"/projects/{project.b64id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT, response.text


async def test_delete_project_403_forbidden_user_without_permissions(client):
    project = await f.create_project()
    user = await f.create_user()

    client.login(user)
    response = client.delete(f"/projects/{project.b64id}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_delete_project_404_not_found_project_b64id(client):
    pj_admin = await f.create_user()
    client.login(pj_admin)
    response = client.delete(f"/projects/{NOT_EXISTING_B64ID}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_delete_project_422_unprocessable_project_b64id(client):
    pj_admin = await f.create_user()
    client.login(pj_admin)
    response = client.delete(f"/projects/{INVALID_B64ID}")
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


##########################################################
# GET /my/projects/<id>/permissions
##########################################################


async def test_get_my_project_permissions_200_ok(client):
    project = await f.create_project()

    client.login(project.created_by)
    response = client.get(f"/my/projects/{project.b64id}/permissions")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_my_project_permissions_404_not_found_project_b64id(client):
    user = await f.create_user()

    client.login(user)
    response = client.get(f"/my/projects/{NOT_EXISTING_B64ID}/permissions")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_get_my_project_permissions_422_unprocessable_project_b64id(client):
    user = await f.create_user()

    client.login(user)
    response = client.get(f"/my/projects/{INVALID_B64ID}/permissions")
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text
