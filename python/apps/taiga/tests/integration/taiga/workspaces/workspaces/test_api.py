# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


import pytest
from fastapi import status
from tests.utils import factories as f

pytestmark = pytest.mark.django_db(transaction=True)


#############################################################
#  POST /my/workspaces/
#############################################################


async def test_create_workspace_success(client):
    user = await f.create_user()
    data = {
        "name": "WS test",
        "color": 1,
    }

    client.login(user)
    response = client.post("/workspaces", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_create_workspace_validation_error(client):
    user = await f.create_user()
    data = {
        "name": "My w0r#%&乕شspace",
        "color": 0,  # error
    }

    client.login(user)
    response = client.post("/workspaces", json=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


#############################################################
#  GET /my/workspaces/
#############################################################


async def test_my_workspaces_being_anonymous(client):
    response = client.get("/my/workspaces")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_my_workspaces_success(client):
    workspace = await f.create_workspace()

    client.login(workspace.created_by)
    response = client.get("/my/workspaces")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1


#############################################################
#  GET /my/workspaces/<id>
#############################################################


async def test_my_workspace_being_anonymous(client):
    workspace = await f.create_workspace()

    response = client.get(f"/my/workspaces/{workspace.b64id}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_my_workspace_success(client):
    workspace = await f.create_workspace()

    client.login(workspace.created_by)
    response = client.get(f"/my/workspaces/{workspace.b64id}")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json()["name"] == workspace.name


async def test_my_workspace_not_found_error_because_invalid_id(client):
    user = await f.create_user()
    non_existent_id = "xxxxxxxxxxxxxxxxxxxxxx"

    client.login(user)
    response = client.get(f"/my/workspaces/{non_existent_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_my_workspace_not_found_error_because_there_is_no_relation(client):
    user = await f.create_user()
    workspace = await f.create_workspace()

    client.login(user)
    response = client.get(f"/my/workspaces/{workspace.b64id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


#############################################################
#  GET /workspaces/<id>
#############################################################


async def test_get_workspace_being_workspace_member(client):
    workspace = await f.create_workspace()

    client.login(workspace.created_by)
    response = client.get(f"/workspaces/{workspace.b64id}")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_workspace_being_no_workspace_member(client):
    workspace = await f.create_workspace()

    user2 = await f.create_user()
    client.login(user2)
    response = client.get(f"/workspaces/{workspace.b64id}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_get_workspace_being_anonymous(client):
    workspace = await f.create_workspace()

    response = client.get(f"/workspaces/{workspace.b64id}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_get_workspace_not_found_error(client):
    user = await f.create_user()
    non_existent_id = "xxxxxxxxxxxxxxxxxxxxxx"

    client.login(user)
    response = client.get(f"/workspaces/{non_existent_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


##########################################################
# PATCH /workspaces/<id>/
##########################################################


async def test_update_workspace_ok(client):
    workspace = await f.create_workspace()
    data = {"name": "New name"}

    client.login(workspace.created_by)
    response = client.patch(f"/workspaces/{workspace.b64id}", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text
    updated_workspace = response.json()
    assert updated_workspace["name"] == "New name"


async def test_update_workspace_not_found(client):
    user = await f.create_user()
    data = {"name": "new name"}

    client.login(user)
    response = client.patch("/workspaces/xxxxxxxxx", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_update_workspace_no_admin(client):
    other_user = await f.create_user()
    workspace = await f.create_workspace()

    data = {"name": "new name"}
    client.login(other_user)
    response = client.patch(f"/workspaces/{workspace.b64id}", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


#############################################################
#  DELETE /workspaces/<id>
#############################################################


async def test_delete_workspace_being_ws_member(client):
    workspace = await f.create_workspace()

    client.login(workspace.created_by)
    response = client.delete(f"/workspaces/{workspace.b64id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT, response.text


async def test_delete_workspace_not_being_ws_member(client):
    user = await f.create_user()
    workspace = await f.create_workspace()

    client.login(user)
    response = client.delete(f"/workspaces/{workspace.b64id}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_delete_workspace_not_found(client):
    user = await f.create_user()
    non_existent_id = "xxxxxxxxxxxxxxxxxxxxxx"

    client.login(user)
    response = client.delete(f"/workspaces/{non_existent_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text
