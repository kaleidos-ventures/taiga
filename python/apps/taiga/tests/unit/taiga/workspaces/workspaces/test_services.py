# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import uuid
from unittest.mock import patch

import pytest
from taiga.workspaces.workspaces import services
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# get_user_workspaces_overview
##########################################################


async def test_get_my_workspaces_projects():
    user = await f.create_user()

    with patch("taiga.workspaces.workspaces.services.workspaces_repositories", autospec=True) as fake_workspaces_repo:
        await services.list_user_workspaces(user=user)
        fake_workspaces_repo.list_user_workspaces_overview.assert_awaited_once_with(user=user)


##########################################################
# get_workspace
##########################################################


async def test_get_workspace():
    ws_id = uuid.uuid1()
    with patch("taiga.workspaces.workspaces.services.workspaces_repositories", autospec=True) as fake_workspaces_repo:
        await services.get_workspace(id=ws_id)
        fake_workspaces_repo.get_workspace.assert_awaited_with(filters={"id": ws_id})


##########################################################
# get_workspace_detail
##########################################################


async def test_get_workspace_detail():
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)

    with (
        patch("taiga.workspaces.workspaces.services.workspaces_repositories", autospec=True) as fake_workspaces_repo,
        patch("taiga.workspaces.workspaces.services.ws_roles_services", autospec=True) as fake_ws_roles_services,
        patch("taiga.workspaces.workspaces.services.projects_repositories", autospec=True) as fake_projects_repo,
    ):
        fake_ws_roles_services.get_workspace_role_name.return_value = "admin"
        fake_projects_repo.get_total_projects.return_value = 1
        await services.get_workspace_detail(id=workspace.id, user_id=user.id)
        fake_workspaces_repo.get_workspace_detail.assert_awaited_with(
            user_id=user.id,
            user_workspace_role_name="admin",
            user_projects_count=1,
            filters={"id": workspace.id},
        )


##########################################################
# get_workspace_summary
##########################################################


async def test_get_workspace_summary():
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)

    with (
        patch("taiga.workspaces.workspaces.services.workspaces_repositories", autospec=True) as fake_workspaces_repo,
        patch("taiga.workspaces.workspaces.services.ws_roles_services", autospec=True) as fake_ws_roles_services,
    ):
        fake_ws_roles_services.get_workspace_role_name.return_value = "admin"
        fake_workspaces_repo.get_workspace_summary.return_value = workspace

        await services.get_workspace_summary(id=workspace.id, user_id=user.id)

        fake_ws_roles_services.get_workspace_role_name.assert_awaited_with(workspace_id=workspace.id, user_id=user.id)
        fake_workspaces_repo.get_workspace_summary.assert_awaited_with(
            filters={"id": workspace.id},
        )


##########################################################
# create_workspace
##########################################################


async def test_create_workspace():
    user = await f.create_user()
    name = "workspace1"
    color = 5
    with (
        patch("taiga.workspaces.workspaces.services.workspaces_repositories", autospec=True) as fake_workspaces_repo,
        patch("taiga.workspaces.workspaces.services.ws_roles_repositories", autospec=True) as fake_ws_roles_repo,
        patch(
            "taiga.workspaces.workspaces.services.ws_memberships_repositories", autospec=True
        ) as fake_ws_memberships_repo,
    ):
        await services.create_workspace(name=name, color=color, owner=user)
        fake_workspaces_repo.create_workspace.assert_awaited_once()
        fake_ws_roles_repo.create_workspace_role.assert_awaited_once()
        fake_ws_memberships_repo.create_workspace_membership.assert_awaited_once()
