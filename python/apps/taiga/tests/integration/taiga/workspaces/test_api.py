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


def test_create_workspace_success(client):
    user = f.UserFactory()
    data = {
        "name": "WS test",
        "color": 1,
    }

    client.login(user)
    response = client.post("/workspaces", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


def test_create_workspace_validation_error(client):
    user = f.UserFactory()
    data = {
        "name": "My w0r#%&乕شspace",
        "color": 0,  # error
    }

    client.login(user)
    response = client.post("/workspaces", json=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


def test_list_workspaces_success(client):
    user = f.UserFactory()
    f.WorkspaceFactory(owner=user)

    client.login(user)
    response = client.get("/workspaces")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1


def test_get_workspace_success(client):
    user = f.UserFactory()
    slug = "ws-test"
    f.WorkspaceFactory(slug=slug, owner=user)

    client.login(user)
    response = client.get(f"/workspaces/{slug}")
    assert response.status_code == status.HTTP_200_OK, response.text


def test_get_workspace_not_found_error(client):
    user = f.UserFactory()

    client.login(user)
    response = client.get("/workspaces/non-existent")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text
