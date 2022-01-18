# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


import pytest
from fastapi import status
from taiga.permissions import choices
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


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


async def test_my_workspaces_success(client):
    user = await f.create_user()
    await f.create_workspace(owner=user)

    client.login(user)
    response = client.get("/my/workspaces")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1


async def test_get_workspace_being_workspace_admin(client):
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)

    client.login(user)
    response = client.get(f"/workspaces/{workspace.slug}")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_workspace_being_workspace_member(client):
    workspace = await f.create_workspace()
    general_member_role = await f.create_workspace_role(
        permissions=choices.WORKSPACE_PERMISSIONS,
        is_admin=False,
        workspace=workspace,
    )
    user2 = await f.create_user()
    await f.create_workspace_membership(user=user2, workspace=workspace, workspace_role=general_member_role)

    client.login(user2)
    response = client.get(f"/workspaces/{workspace.slug}")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_workspace_being_no_workspace_member(client):
    workspace = await f.create_workspace()

    user2 = await f.create_user()
    client.login(user2)
    response = client.get(f"/workspaces/{workspace.slug}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_get_workspace_being_anonymous(client):
    workspace = await f.create_workspace()

    response = client.get(f"/workspaces/{workspace.slug}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_get_workspace_not_found_error(client):
    user = await f.create_user()

    client.login(user)
    response = client.get("/workspaces/non-existent")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text
