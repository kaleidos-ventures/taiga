# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


import pytest
from fastapi import status
from fastapi.testclient import TestClient
from taiga.exceptions.api import codes
from taiga.main import api
from tests.utils import factories as f

pytestmark = pytest.mark.django_db(transaction=True)

client = TestClient(api)


def test_create_workspace_with_empty_name():
    name = ""
    color = 1

    response = client.post("/workspaces", json={"name": name, "color": color})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text
    assert response.json()["error"]["code"] == codes.EX_VALIDATION_ERROR
    assert response.json()["error"]["detail"][0]["msg"] == "Empty name is not allowed."


def test_create_workspace_with_long_name():
    name = "WS ab c de f gh i jk l mn pw r st u vw x yz"
    color = 1

    response = client.post("/workspaces", json={"name": name, "color": color})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text
    assert response.json()["error"]["code"] == codes.EX_VALIDATION_ERROR
    assert response.json()["error"]["detail"][0]["msg"] == "Name too long"


def test_create_workspace_with_invalid_color():
    name = "WS test"
    color = 9

    response = client.post("/workspaces", json={"name": name, "color": color})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text
    assert response.json()["error"]["code"] == codes.EX_VALIDATION_ERROR
    assert response.json()["error"]["detail"][0]["msg"] == "Color not allowed."


def test_create_workspace_with_color_string():
    name = "WS test"
    color = "0F0F0F"

    response = client.post("/workspaces", json={"name": name, "color": color})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text
    assert response.json()["error"]["code"] == codes.EX_VALIDATION_ERROR
    assert response.json()["error"]["detail"][0]["msg"] == "value is not a valid integer"


def test_create_workspace_with_valid_data():
    username = "admin"
    f.UserFactory(username=username)

    name = "WS test"
    color = 1

    response = client.post("/workspaces", json={"name": name, "color": color})
    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json()["name"] == "WS test"
    assert response.json()["color"] == 1


def test_create_workspace_with_valid_non_ASCII_blank_chars():
    username = "admin"
    f.UserFactory(username=username)
    name = "       My w0r#%&乕شspace         "
    color = 1

    response = client.post("/workspaces", json={"name": name, "color": color})
    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json()["name"] == "My w0r#%&乕شspace"
    assert response.json()["slug"] == "my-w0rhu-shspace"
    assert response.json()["color"] == 1


def test_workspaces_by_nonexistent_owner_id():
    response = client.get("/workspaces?owner_id=99")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


def test_workspaces_by_owner_id():
    name = "WS test"
    color = 3
    workspace = f.WorkspaceFactory(name=name, color=color)

    url = "/workspaces?owner_id=" + str(workspace.owner_id)
    response = client.get(url)
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1
    assert response.json()[0]["name"] == "WS test"
    assert response.json()[0]["color"] == 3


def test_nonexistent_workspace():
    response = client.get("/workspaces/99")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


def test_existent_workspace():
    name = "WS test"
    color = 1
    workspace = f.WorkspaceFactory(name=name, color=color)

    url = "/workspaces/" + str(workspace.id)
    response = client.get(url)
    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json()["name"] == "WS test"
    assert response.json()["color"] == 1
