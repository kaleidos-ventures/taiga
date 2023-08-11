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


##########################################################
# LIST /workspaces/<id>/memberships
##########################################################


async def test_list_workspace_memberships(client):
    workspace = await f.create_workspace()
    ws_member = await f.create_user()
    await f.create_workspace_membership(user=ws_member, workspace=workspace)

    client.login(ws_member)
    response = client.get(f"/workspaces/{workspace.b64id}/memberships")
    assert len(response.json()) == 2
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_list_workspace_memberships_wrong_id(client):
    workspace = await f.create_workspace()
    non_existent_id = "xxxxxxxxxxxxxxxxxxxxxx"

    client.login(workspace.created_by)

    response = client.get(f"/workspaces/{non_existent_id}/memberships")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_list_workspace_memberships_not_a_member(client):
    workspace = await f.create_workspace()
    not_a_member = await f.create_user()

    client.login(not_a_member)

    response = client.get(f"/workspaces/{workspace.b64id}/memberships")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


##########################################################
# LIST /workspaces/<id>/guests
##########################################################


async def test_list_workspace_guests(client):
    user = await f.create_user()
    member = await f.create_user()
    workspace = await f.create_workspace(created_by=user)
    project = await f.create_project(created_by=user, workspace=workspace)
    general_role = await f.create_project_role(project=project, is_admin=False)
    await f.create_project_membership(user=member, project=project, role=general_role)

    client.login(user)
    response = client.get(f"/workspaces/{workspace.b64id}/guests")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_list_workspace_guests_with_pagination(client):
    user = await f.create_user()
    member1 = await f.create_user()
    member2 = await f.create_user()
    workspace = await f.create_workspace(created_by=user)
    project = await f.create_project(created_by=user, workspace=workspace)
    general_role = await f.create_project_role(project=project, is_admin=False)
    await f.create_project_membership(user=member1, project=project, role=general_role)
    await f.create_project_membership(user=member2, project=project, role=general_role)
    offset = 0
    limit = 1

    client.login(user)
    response = client.get(f"/workspaces/{workspace.b64id}/guests?offset={offset}&limit={limit}")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1
    assert response.headers["Pagination-Offset"] == "0"
    assert response.headers["Pagination-Limit"] == "1"
    assert response.headers["Pagination-Total"] == "2"


async def test_list_workspace_guests_wrong_id(client):
    workspace = await f.create_workspace()
    non_existent_id = "xxxxxxxxxxxxxxxxxxxxxx"

    client.login(workspace.created_by)

    response = client.get(f"/workspaces/{non_existent_id}/guests")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_list_workspace_guests_not_a_member(client):
    workspace = await f.create_workspace()
    not_a_member = await f.create_user()

    client.login(not_a_member)

    response = client.get(f"/workspaces/{workspace.b64id}/guests")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


##########################################################
# DELETE /workspaces/<id>/memberships/<username>
##########################################################


async def test_delete_workspace_membership(client):
    user = await f.create_user()
    member = await f.create_user()
    workspace = await f.create_workspace(created_by=user)
    await f.create_workspace_membership(workspace=workspace, user=member)

    client.login(user)
    response = client.delete(f"/workspaces/{workspace.b64id}/memberships/{member.username}")
    assert response.status_code == status.HTTP_204_NO_CONTENT, response.text


async def test_delete_workspace_membership_no_permission(client):
    user = await f.create_user()
    member = await f.create_user()
    workspace = await f.create_workspace(created_by=user)

    client.login(member)
    response = client.delete(f"/workspaces/{workspace.b64id}/memberships/{user.username}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_delete_workspace_membership_latest_membership(client):
    user = await f.create_user()
    workspace = await f.create_workspace(created_by=user)

    client.login(user)
    response = client.delete(f"/workspaces/{workspace.b64id}/memberships/{user.username}")
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text
