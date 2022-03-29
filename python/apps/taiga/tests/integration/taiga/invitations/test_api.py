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


async def test_create_invitations_anonymous_user(client):
    project = await f.create_project()
    data = {
        "invitations": [
            {"email": "user-test@email.com", "role_slug": "admin"},
            {"email": "test@email.com", "role_slug": "general"},
        ]
    }
    response = client.post(f"/projects/{project.slug}/invitations", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_create_invitations_user_without_permission(client):
    project = await f.create_project()
    data = {
        "invitations": [
            {"email": "user-test@email.com", "role_slug": "admin"},
            {"email": "test@email.com", "role_slug": "general"},
        ]
    }
    user = await f.create_user()
    client.login(user)
    response = client.post(f"/projects/{project.slug}/invitations", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_create_invitations_project_not_found(client):
    user = await f.create_user()
    data = {
        "invitations": [
            {"email": "user-test@email.com", "role_slug": "admin"},
            {"email": "test@email.com", "role_slug": "general"},
        ]
    }
    client.login(user)
    response = client.post("/projects/non-existent/invitations", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_create_invitations_non_existing_role(client):
    user = await f.create_user()
    project = await f.create_project(owner=user)
    data = {
        "invitations": [
            {"email": "test@email.com", "role_slug": "non_existing_role"},
        ]
    }
    client.login(user)
    response = client.post(f"/projects/{project.slug}/invitations", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_create_invitations(client):
    user = await f.create_user()
    await f.create_user(email="user-test@email.com")
    project = await f.create_project(owner=user)
    data = {
        "invitations": [
            {"email": "user-test@email.com", "role_slug": "admin"},
            {"email": "test@email.com", "role_slug": "general"},
        ]
    }
    client.login(user)
    response = client.post(f"/projects/{project.slug}/invitations", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text
