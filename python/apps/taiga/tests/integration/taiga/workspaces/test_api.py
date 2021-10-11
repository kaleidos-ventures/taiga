# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


import pytest
from fastapi import status
from taiga.exceptions.api import codes
from tests.utils import factories as f

pytestmark = pytest.mark.django_db(transaction=True)


def test_create_workspace_with_empty_name(client):
    name = ""
    color = 1

    response = client.post("/workspaces", json={"name": name, "color": color})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text
    assert response.json()["error"]["code"] == codes.EX_VALIDATION_ERROR["code"]
    assert response.json()["error"]["detail"][0]["msg"] == "Empty name is not allowed."


def test_create_workspace_with_long_name(client):
    name = "WS ab c de f gh i jk l mn pw r st u vw x yz"
    color = 1

    response = client.post("/workspaces", json={"name": name, "color": color})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text
    assert response.json()["error"]["code"] == codes.EX_VALIDATION_ERROR["code"]
    assert response.json()["error"]["detail"][0]["msg"] == "Name too long"


def test_create_workspace_with_invalid_color(client):
    name = "WS test"
    color = 9

    response = client.post("/workspaces", json={"name": name, "color": color})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text
    assert response.json()["error"]["code"] == codes.EX_VALIDATION_ERROR["code"]
    assert response.json()["error"]["detail"][0]["msg"] == "Color not allowed."


def test_create_workspace_with_color_string(client):
    name = "WS test"
    color = "0F0F0F"

    response = client.post("/workspaces", json={"name": name, "color": color})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text
    assert response.json()["error"]["code"] == codes.EX_VALIDATION_ERROR["code"]
    assert response.json()["error"]["detail"][0]["msg"] == "value is not a valid integer"


def test_create_workspace_with_valid_data(client):
    username = "user1"
    user = f.UserFactory(username=username)
    name = "WS test"
    color = 1

    client.login(user)
    response = client.post("/workspaces", json={"name": name, "color": color})
    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json()["name"] == "WS test"
    assert response.json()["color"] == 1


def test_create_workspace_with_valid_non_ASCII_blank_chars(client):
    username = "user1"
    user = f.UserFactory(username=username)
    name = "       My w0r#%&乕شspace         "
    color = 1

    client.login(user)
    response = client.post("/workspaces", json={"name": name, "color": color})
    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json()["name"] == "My w0r#%&乕شspace"
    assert response.json()["slug"] == "my-w0rhu-shspace"
    assert response.json()["color"] == 1


def test_workspaces_by_owner(client):
    username = "user1"
    user = f.UserFactory(username=username)
    name = "WS test"
    color = 3
    f.WorkspaceFactory(name=name, color=color, owner=user)

    client.login(user)
    response = client.get("/workspaces")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1
    assert response.json()[0]["name"] == "WS test"
    assert response.json()[0]["color"] == 3


def test_nonexistent_workspace(client):
    username = "user1"
    user = f.UserFactory(username=username)

    client.login(user)
    response = client.get("/workspaces/non-existent")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


def test_existent_workspace(client):
    username = "user1"
    user = f.UserFactory(username=username)
    name = "WS test"
    color = 1
    f.WorkspaceFactory(name=name, color=color, owner=user)

    client.login(user)
    response = client.get("/workspaces/ws-test")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json()["name"] == "WS test"
    assert response.json()["color"] == 1
