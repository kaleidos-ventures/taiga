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


#########################################################################
# PUT /projects/<project_slug>/roles/<role_slug>/permissions
#########################################################################


async def test_update_project_role_permissions_anonymous_user(client):
    project = await f.create_project()
    role_slug = "general"
    data = {"permissions": ["view_story"]}

    response = client.put(f"/projects/{project.slug}/roles/{role_slug}/permissions", json=data)

    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_update_project_role_permissions_project_not_found(client):
    user = await f.create_user()
    data = {"permissions": ["view_story"]}

    client.login(user)
    response = client.put("/projects/non-existent/roles/role-slug/permissions", json=data)

    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_update_project_role_permissions_role_not_found(client):
    project = await f.create_project()
    data = {"permissions": ["view_story"]}

    client.login(project.owner)
    response = client.put(f"/projects/{project.slug}/roles/role-slug/permissions", json=data)

    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_update_project_role_permissions_user_without_permission(client):
    user = await f.create_user()
    project = await f.create_project()
    data = {"permissions": ["view_story"]}

    client.login(user)
    response = client.put(f"/projects/{project.slug}/roles/role-slug/permissions", json=data)

    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_update_project_role_permissions_role_admin(client):
    project = await f.create_project()
    role_slug = "admin"
    data = {"permissions": ["view_story"]}

    client.login(project.owner)
    response = client.put(f"/projects/{project.slug}/roles/{role_slug}/permissions", json=data)

    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_update_project_role_permissions_incompatible_permissions(client):
    project = await f.create_project()
    role_slug = "general"
    data = {"permissions": ["view_task"]}

    client.login(project.owner)
    response = client.put(f"/projects/{project.slug}/roles/{role_slug}/permissions", json=data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_update_project_role_permissions_not_valid_permissions(client):
    project = await f.create_project()
    role_slug = "general"
    data = {"permissions": ["not_valid", "foo"]}

    client.login(project.owner)
    response = client.put(f"/projects/{project.slug}/roles/{role_slug}/permissions", json=data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_update_project_role_permissions_ok(client):
    project = await f.create_project()
    role_slug = "general"
    data = {"permissions": ["view_story"]}

    client.login(project.owner)
    response = client.put(f"/projects/{project.slug}/roles/{role_slug}/permissions", json=data)

    assert response.status_code == status.HTTP_200_OK, response.text
    assert data["permissions"] == response.json()["permissions"]


##########################################################
# GET /projects/<slug>/memberships
##########################################################


async def test_get_project_memberships(client):
    project = await f.create_project()

    general_member_role = await f.create_project_role(
        project=project,
        permissions=choices.ProjectPermissions.values,
        is_admin=False,
    )

    pj_member = await f.create_user()
    await f.create_project_membership(user=pj_member, project=project, role=general_member_role)

    client.login(pj_member)
    response = client.get(f"/projects/{project.slug}/memberships")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_project_memberships_with_pagination(client):
    project = await f.create_project()

    general_member_role = await f.create_project_role(
        project=project,
        permissions=choices.ProjectPermissions.values,
        is_admin=False,
    )

    pj_member = await f.create_user()
    pj_member2 = await f.create_user()
    await f.create_project_membership(user=pj_member, project=project, role=general_member_role)
    await f.create_project_membership(user=pj_member2, project=project, role=general_member_role)

    client.login(pj_member)

    offset = 0
    limit = 1

    response = client.get(f"/projects/{project.slug}/memberships?offset={offset}&limit={limit}")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1
    assert response.headers["Pagination-Offset"] == "0"
    assert response.headers["Pagination-Limit"] == "1"
    assert response.headers["Pagination-Total"] == "3"


async def test_get_project_memberships_wrong_slug(client):
    project = await f.create_project()

    client.login(project.owner)
    response = client.get("/projects/WRONG_PJ_SLUG/memberships")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_get_project_memberships_not_a_member(client):
    project = await f.create_project()
    not_a_member = await f.create_user()

    client.login(not_a_member)
    response = client.get(f"/projects/{project.slug}/memberships")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


##########################################################
# PATCH /projects/<slug>/memberships/<username>
##########################################################


async def test_update_project_membership_role_membership_not_exist(client):
    owner = await f.create_user()
    project = await f.create_project(owner=owner)

    client.login(owner)
    username = "not_exist"
    data = {"role_slug": "general"}
    response = client.patch(f"projects/{project.slug}/memberships/{username}", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_update_project_membership_role_user_without_permission(client):
    owner = await f.create_user()
    project = await f.create_project(owner=owner)
    user = await f.create_user()
    general_member_role = await f.create_project_role(
        project=project,
        permissions=choices.ProjectPermissions.values,
        is_admin=False,
    )
    await f.create_project_membership(user=user, project=project, role=general_member_role)

    client.login(user)
    username = owner.username
    data = {"role_slug": "general"}
    response = client.patch(f"/projects/{project.slug}/memberships/{username}", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_update_project_membership_role_ok(client):
    owner = await f.create_user()
    project = await f.create_project(owner=owner)
    user = await f.create_user()
    general_member_role = await f.create_project_role(
        project=project,
        permissions=choices.ProjectPermissions.values,
        is_admin=False,
    )
    await f.create_project_membership(user=user, project=project, role=general_member_role)

    client.login(owner)
    username = user.username
    data = {"role_slug": "admin"}
    response = client.patch(f"projects/{project.slug}/memberships/{username}", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text
