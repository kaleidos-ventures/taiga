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


##########################################################
# POST /workspaces/<id>/invitations
##########################################################


async def test_create_workspace_invitations_anonymous_user(client):
    workspace = await f.create_workspace()
    data = {
        "invitations": [
            {"username_or_email": "user-test@email.com"},
            {"username_or_email": "test@email.com"},
        ]
    }
    response = client.post(f"/workspaces/{workspace.b64id}/invitations", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_create_workspace_invitations_user_without_permission(client):
    workspace = await f.create_workspace()
    data = {
        "invitations": [
            {"username_or_email": "user-test@email.com"},
            {"username_or_email": "test@email.com"},
        ]
    }
    user = await f.create_user()
    client.login(user)
    response = client.post(f"/workspaces/{workspace.b64id}/invitations", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_create_workspace_invitations_workspace_not_found(client):
    user = await f.create_user()
    data = {
        "invitations": [
            {"username_or_email": "user-test@email.com"},
            {"username_or_email": "test@email.com"},
        ]
    }
    non_existent_id = "xxxxxxxxxxxxxxxxxxxxxx"
    client.login(user)
    response = client.post(f"/workspaces/{non_existent_id}/invitations", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_create_workspace_invitations_not_existing_username(client):
    workspace = await f.create_workspace()
    data = {"invitations": [{"username_or_email": "not-a-username"}]}
    client.login(workspace.created_by)
    response = client.post(f"/workspaces/{workspace.b64id}/invitations", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_create_workspace_invitations(client):
    invitee1 = await f.create_user(email="invitee1@taiga.demo", username="invitee1")
    await f.create_user(email="invitee2@taiga.demo", username="invitee2")
    workspace = await f.create_workspace()
    data = {
        "invitations": [
            {"username_or_email": "invitee2@taiga.demo"},
            {"username_or_email": "test@email.com"},
            {"username_or_email": invitee1.username},
        ]
    }
    client.login(workspace.created_by)
    response = client.post(f"/workspaces/{workspace.b64id}/invitations", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text
