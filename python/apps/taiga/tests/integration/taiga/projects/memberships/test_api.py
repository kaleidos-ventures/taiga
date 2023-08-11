# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from fastapi import status
from taiga.permissions import choices
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# LIST /projects/<id>/memberships
##########################################################


async def test_get_project_memberships(client):
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

    response = client.get(f"/projects/{project.b64id}/memberships")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 3


async def test_list_project_memberships_wrong_id(client):
    project = await f.create_project()
    non_existent_id = "xxxxxxxxxxxxxxxxxxxxxx"

    client.login(project.created_by)
    response = client.get(f"/projects/{non_existent_id}/memberships")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_list_project_memberships_not_a_member(client):
    project = await f.create_project()
    not_a_member = await f.create_user()

    client.login(not_a_member)
    response = client.get(f"/projects/{project.b64id}/memberships")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


##########################################################
# PATCH /projects/<id>/memberships/<username>
##########################################################


async def test_update_project_membership_role_membership_not_exist(client):
    project = await f.create_project()

    client.login(project.created_by)
    username = "not_exist"
    data = {"role_slug": "general"}
    response = client.patch(f"projects/{project.b64id}/memberships/{username}", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_update_project_membership_role_user_without_permission(client):
    project = await f.create_project()
    user = await f.create_user()
    general_member_role = await f.create_project_role(
        project=project,
        permissions=choices.ProjectPermissions.values,
        is_admin=False,
    )
    await f.create_project_membership(user=user, project=project, role=general_member_role)

    client.login(user)
    username = project.created_by.username
    data = {"role_slug": "general"}
    response = client.patch(f"/projects/{project.b64id}/memberships/{username}", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_update_project_membership_role_ok(client):
    project = await f.create_project()
    user = await f.create_user()
    general_member_role = await f.create_project_role(
        project=project,
        permissions=choices.ProjectPermissions.values,
        is_admin=False,
    )
    await f.create_project_membership(user=user, project=project, role=general_member_role)

    client.login(project.created_by)
    username = user.username
    data = {"role_slug": "admin"}
    response = client.patch(f"projects/{project.b64id}/memberships/{username}", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


##########################################################
# DELETE /projects/<id>/memberships/<username>
##########################################################


async def test_delete_project_membership_not_exist(client):
    project = await f.create_project()
    username = "not_exist"

    client.login(project.created_by)
    response = client.delete(f"/projects/{project.b64id}/memberships/{username}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_delete_project_membership_without_permissions(client):
    project = await f.create_project()
    member = await f.create_user()
    general_member_role = await f.create_project_role(
        project=project,
        permissions=choices.ProjectPermissions.values,
        is_admin=False,
    )
    await f.create_project_membership(user=member, project=project, role=general_member_role)

    client.login(member)
    response = client.delete(f"/projects/{project.b64id}/memberships/{project.created_by.username}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_delete_project_membership_project_admin(client):
    project = await f.create_project()
    member = await f.create_user()
    general_member_role = await f.create_project_role(
        project=project,
        permissions=choices.ProjectPermissions.values,
        is_admin=False,
    )
    await f.create_project_membership(user=member, project=project, role=general_member_role)

    client.login(project.created_by)
    response = client.delete(f"/projects/{project.b64id}/memberships/{member.username}")
    assert response.status_code == status.HTTP_204_NO_CONTENT, response.text


async def test_delete_project_membership_self_request(client):
    project = await f.create_project()
    member = await f.create_user()
    general_member_role = await f.create_project_role(
        project=project,
        permissions=choices.ProjectPermissions.values,
        is_admin=False,
    )
    await f.create_project_membership(user=member, project=project, role=general_member_role)

    client.login(member)
    response = client.delete(f"/projects/{project.b64id}/memberships/{member.username}")
    assert response.status_code == status.HTTP_204_NO_CONTENT, response.text
