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

pytestmark = pytest.mark.django_db(transaction=True)


##########################################################
# POST /projects
##########################################################


async def test_create_project_being_workspace_member(client):
    workspace = await f.create_workspace()
    data = {"name": "Project test", "color": 1, "workspaceId": workspace.b64id}
    files = {"logo": ("logo.png", f.build_image_file("logo"), "image/png")}

    client.login(workspace.created_by)
    response = client.post("/projects", data=data, files=files)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_create_project_being_no_workspace_member(client):
    workspace = await f.create_workspace()
    user2 = await f.create_user()
    data = {"name": "Project test", "color": 1, "workspaceId": workspace.b64id}
    files = {"logo": ("logo.png", f.build_image_file("logo"), "image/png")}

    client.login(user2)
    response = client.post("/projects", data=data, files=files)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_create_project_being_anonymous(client):
    workspace = await f.create_workspace()
    data = {"name": "Project test", "color": 1, "workspaceId": workspace.b64id}
    files = {"logo": ("logo.png", f.build_image_file("logo"), "image/png")}

    response = client.post("/projects", data=data, files=files)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_create_project_invalid_b64uuid_error(client):
    workspace = await f.create_workspace()
    data = {"name": "My pro#%&乕شject", "color": 1, "workspaceId": "ws-invalid"}

    client.login(workspace.created_by)
    response = client.post("/projects", data=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_create_project_invalid_validation_error(client):
    workspace = await f.create_workspace()
    data = {"name": "My project", "color": 12, "workspaceId": workspace.b64id}

    client.login(workspace.created_by)
    response = client.post("/projects", data=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


##########################################################
# GET /workspaces/<id>/projects
##########################################################


async def test_list_workspace_projects_success(client):
    workspace = await f.create_workspace()
    await f.create_project(workspace=workspace, created_by=workspace.created_by)

    client.login(workspace.created_by)
    response = client.get(f"/workspaces/{workspace.b64id}/projects")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1


async def test_list_workspace_projects_workspace_not_found(client):
    user = await f.create_user()
    non_existent_id = "xxxxxxxxxxxxxxxxxxxxxx"

    client.login(user)
    response = client.get(f"/workspaces/{non_existent_id}/projects")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


##########################################################
# GET /workspaces/<id>/invited-projects
##########################################################


async def test_list_workspace_invited_projects_success(client):
    workspace = await f.create_workspace()
    project = await f.create_project(workspace=workspace, created_by=workspace.created_by)
    user2 = await f.create_user()
    await f.create_workspace_membership(user=user2, workspace=workspace)
    await f.create_project_invitation(email=user2.email, user=user2, project=project, invited_by=workspace.created_by)

    client.login(user2)
    response = client.get(f"/workspaces/{workspace.b64id}/invited-projects")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1


async def test_list_workspace_invited_projects_workspace_not_found(client):
    user = await f.create_user()
    non_existent_id = "xxxxxxxxxxxxxxxxxxxxxx"

    client.login(user)
    response = client.get(f"/workspaces/{non_existent_id}/invited-projects")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


##########################################################
# GET /projects/<id>
##########################################################


async def test_get_project_being_project_admin(client):
    project = await f.create_project()

    client.login(project.created_by)
    response = client.get(f"/projects/{project.b64id}")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_project_being_project_member(client):
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


async def test_get_project_being_invited_user(client):
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


async def test_get_project_being_no_project_member(client):
    project = await f.create_project()
    user2 = await f.create_user()

    client.login(user2)
    response = client.get(f"/projects/{project.b64id}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_get_project_being_anonymous(client):
    project = await f.create_project()

    response = client.get(f"/projects/{project.b64id}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_get_project_not_found_error(client):
    user = await f.create_user()
    non_existent_id = "xxxxxxxxxxxxxxxxxxxxxx"

    client.login(user)
    response = client.get(f"/projects/{non_existent_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


##########################################################
# GET /projects/<id>/public-permissions
##########################################################


async def test_get_project_public_permissions_ok(client):
    project = await f.create_project()

    client.login(project.created_by)
    response = client.get(f"/projects/{project.b64id}/public-permissions")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_project_public_permissions_no_admin(client):
    project = await f.create_project()
    user2 = await f.create_user()

    client.login(user2)
    response = client.get(f"/projects/{project.b64id}/public-permissions")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_get_project_public_permissions_no_member(client):
    project = await f.create_project()
    user = await f.create_user()

    client.login(user)
    response = client.get(f"/projects/{project.b64id}/public-permissions")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_get_project_public_permissions_anonymous_user(client):
    project = await f.create_project()

    response = client.get(f"/projects/{project.b64id}/public-permissions")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


##########################################################
# PATCH /projects/<id>/
##########################################################


async def test_update_project_ok(client):
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


async def test_update_project_delete_description(client):
    project = await f.create_project()

    data = {"description": ""}

    client.login(project.created_by)
    response = client.patch(f"/projects/{project.b64id}", data=data)
    assert response.status_code == status.HTTP_200_OK, response.text
    updated_project = response.json()
    assert updated_project["name"] == project.name
    assert updated_project["description"] == ""


async def test_update_project_not_found(client):
    user = await f.create_user()
    data = {"name": "new name"}

    client.login(user)
    response = client.patch("/projects/xxxxxxxxx", data=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_update_project_no_admin(client):
    other_user = await f.create_user()
    project = await f.create_project()

    data = {"name": "new name"}
    client.login(other_user)
    response = client.patch(f"/projects/{project.b64id}", data=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


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
async def test_update_project_public_permissions_ok(client, permissions):
    project = await f.create_project()
    data = {"permissions": permissions}

    client.login(project.created_by)
    response = client.put(f"/projects/{project.b64id}/public-permissions", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_update_project_public_permissions_project_not_found(client):
    user = await f.create_user()
    data = {"permissions": ["view_story"]}
    non_existent_id = "xxxxxxxxxxxxxxxxxxxxxx"

    client.login(user)
    response = client.put(f"/projects/{non_existent_id}/public-permissions", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


@pytest.mark.parametrize(
    "permissions",
    [
        (["modify_story"]),
        (["delete_story"]),
    ],
)
async def test_update_project_public_permissions_incompatible(client, permissions):
    project = await f.create_project()
    data = {"permissions": permissions}

    client.login(project.created_by)
    response = client.put(f"/projects/{project.b64id}/public-permissions", json=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


async def test_update_project_public_permissions_not_valid(client):
    project = await f.create_project()
    data = {"permissions": ["not_valid"]}

    client.login(project.created_by)
    response = client.put(f"/projects/{project.b64id}/public-permissions", json=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


async def test_update_project_public_permissions_no_admin(client):
    project = await f.create_project()
    user2 = await f.create_user()
    data = {"permissions": []}

    client.login(user2)
    response = client.put(f"/projects/{project.b64id}/public-permissions", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_update_project_public_permissions_no_member(client):
    project = await f.create_project()
    user = await f.create_user()
    data = {"permissions": []}

    client.login(user)
    response = client.put(f"/projects/{project.b64id}/public-permissions", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_update_project_public_permissions_anonymous_user(client):
    project = await f.create_project()
    data = {"permissions": []}

    response = client.put(f"/projects/{project.b64id}/public-permissions", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


##########################################################
# DELETE /projects/<id>
##########################################################


async def test_delete_project_invalid(client):
    pj_admin = await f.create_user()

    client.login(pj_admin)
    response = client.delete("/projects/INVALID_PJ_ID")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_delete_project_user_without_permissions(client):
    project = await f.create_project()
    user = await f.create_user()

    client.login(user)
    response = client.delete(f"/projects/{project.b64id}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_delete_project_being_proj_admin(client):
    project = await f.create_project()

    client.login(project.created_by)
    response = client.delete(f"/projects/{project.b64id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT, response.text


async def test_delete_project_being_ws_admin(client):
    ws = await f.create_workspace()
    project = await f.create_project(workspace=ws)

    client.login(ws.created_by)
    response = client.delete(f"/projects/{project.b64id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT, response.text


##########################################################
# GET /my/projects/<id>/permissions
##########################################################


async def test_get_my_project_permissions_ok(client):
    project = await f.create_project()

    client.login(project.created_by)
    response = client.get(f"/my/projects/{project.b64id}/permissions")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_my_project_permissions_no_project(client):
    user = await f.create_user()
    non_existent_id = "xxxxxxxxxxxxxxxxxxxxxx"

    client.login(user)
    response = client.get(f"/my/projects/{non_existent_id}/permissions")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text
