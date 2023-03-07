# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from fastapi import status
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


#########################################################################
# GET /projects/<project_id>/roles
#########################################################################

# TODO: missing tests


#########################################################################
# PUT /projects/<project_id>/roles/<role_slug>/permissions
#########################################################################


async def test_update_project_role_permissions_anonymous_user(client):
    project = await f.create_project()
    role_slug = "general"
    data = {"permissions": ["view_story"]}

    response = client.put(f"/projects/{project.b64id}/roles/{role_slug}/permissions", json=data)

    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_update_project_role_permissions_project_not_found(client):
    user = await f.create_user()
    data = {"permissions": ["view_story"]}
    non_existent_id = "xxxxxxxxxxxxxxxxxxxxxx"

    client.login(user)
    response = client.put(f"/projects/{non_existent_id}/roles/role-slug/permissions", json=data)

    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_update_project_role_permissions_role_not_found(client):
    project = await f.create_project()
    data = {"permissions": ["view_story"]}

    client.login(project.created_by)
    response = client.put(f"/projects/{project.b64id}/roles/role-slug/permissions", json=data)

    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_update_project_role_permissions_user_without_permission(client):
    user = await f.create_user()
    project = await f.create_project()
    data = {"permissions": ["view_story"]}

    client.login(user)
    response = client.put(f"/projects/{project.b64id}/roles/general/permissions", json=data)

    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_update_project_role_permissions_role_admin(client):
    project = await f.create_project()
    role_slug = "admin"
    data = {"permissions": ["view_story"]}

    client.login(project.created_by)
    response = client.put(f"/projects/{project.b64id}/roles/{role_slug}/permissions", json=data)

    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_update_project_role_permissions_incompatible_permissions(client):
    project = await f.create_project()
    role_slug = "general"
    data = {"permissions": ["view_task"]}

    client.login(project.created_by)
    response = client.put(f"/projects/{project.b64id}/roles/{role_slug}/permissions", json=data)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


async def test_update_project_role_permissions_not_valid_permissions(client):
    project = await f.create_project()
    role_slug = "general"
    data = {"permissions": ["not_valid", "foo"]}

    client.login(project.created_by)
    response = client.put(f"/projects/{project.b64id}/roles/{role_slug}/permissions", json=data)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


async def test_update_project_role_permissions_ok(client):
    project = await f.create_project()
    role_slug = "general"
    data = {"permissions": ["view_story"]}

    client.login(project.created_by)
    response = client.put(f"/projects/{project.b64id}/roles/{role_slug}/permissions", json=data)

    assert response.status_code == status.HTTP_200_OK, response.text
    assert data["permissions"] == response.json()["permissions"]
