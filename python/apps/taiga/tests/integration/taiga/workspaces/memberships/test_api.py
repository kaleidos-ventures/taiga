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
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_list_workspace_memberships_with_pagination(client):
    workspace = await f.create_workspace()
    ws_member1 = await f.create_user()
    ws_member2 = await f.create_user()
    await f.create_workspace_membership(user=ws_member1, workspace=workspace)
    await f.create_workspace_membership(user=ws_member2, workspace=workspace)

    client.login(workspace.created_by)

    offset = 0
    limit = 1

    response = client.get(f"/workspaces/{workspace.b64id}/memberships?offset={offset}&limit={limit}")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1
    assert response.headers["Pagination-Offset"] == "0"
    assert response.headers["Pagination-Limit"] == "1"
    assert response.headers["Pagination-Total"] == "3"


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
