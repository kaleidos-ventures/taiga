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

pytestmark = pytest.mark.django_db(transaction=True)


def test_update_project_role_permissions_anonymous_user(client):
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.create_project(owner=user, workspace=workspace)
    role_slug = "general-members"
    data = {"permissions": ["view_project"]}
    response = client.put(f"/projects/{project.slug}/roles/{role_slug}/permissions", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_update_project_role_permissions_project_not_found(client):
    user = f.UserFactory()
    client.login(user)
    data = {"permissions": ["view_project"]}
    response = client.put("/projects/non-existent/roles/role-slug/permissions", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


def test_update_project_role_permissions_role_not_found(client):
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.create_project(owner=user, workspace=workspace)
    client.login(user)
    data = {"permissions": ["view_project"]}
    response = client.put(f"/projects/{project.slug}/roles/role-slug/permissions", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


def test_update_project_role_permissions_user_without_permission(client):
    user1 = f.UserFactory()
    workspace = f.create_workspace(owner=user1)
    project = f.create_project(owner=user1, workspace=workspace)
    user2 = f.UserFactory()
    client.login(user2)
    data = {"permissions": ["view_project"]}
    response = client.put(f"/projects/{project.slug}/roles/role-slug/permissions", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_update_project_role_permissions_role_admin(client):
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.create_project(owner=user, workspace=workspace)
    role_slug = "admin"
    client.login(user)
    data = {"permissions": ["view_project"]}
    response = client.put(f"/projects/{project.slug}/roles/{role_slug}/permissions", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


def test_update_project_role_permissions_incompatible_permissions(client):
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.create_project(owner=user, workspace=workspace)
    role_slug = "general-members"
    client.login(user)
    data = {"permissions": ["view_project", "view_tasks"]}
    response = client.put(f"/projects/{project.slug}/roles/{role_slug}/permissions", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


def test_update_project_role_permissions_not_valid_permissions(client):
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.create_project(owner=user, workspace=workspace)
    role_slug = "general-members"
    client.login(user)
    data = {"permissions": ["not_valid", "foo"]}
    response = client.put(f"/projects/{project.slug}/roles/{role_slug}/permissions", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


def test_update_project_role_permissions_ok(client):
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.create_project(owner=user, workspace=workspace)
    role_slug = "general-members"
    # default permissions given by template should be the same as PROJECT_PERMISSIONS
    assert [x in project.roles.get(slug=role_slug).permissions for x in choices.PROJECT_PERMISSIONS]
    client.login(user)
    data = {"permissions": ["view_project"]}
    response = client.put(f"/projects/{project.slug}/roles/{role_slug}/permissions", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text
    assert data["permissions"] == response.json()["permissions"]
