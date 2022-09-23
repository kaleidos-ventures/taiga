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
