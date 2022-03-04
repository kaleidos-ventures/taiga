# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import patch

import pytest
from taiga.workspaces import services
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# get_my_workspaces_projects
##########################################################


async def test_get_my_workspaces_projects():
    user = await f.create_user()

    with patch("taiga.workspaces.services.workspaces_repositories", autospec=True) as fake_workspaces_repo:
        await services.get_user_workspaces_with_latest_projects(user=user)
        fake_workspaces_repo.get_user_workspaces_with_latest_projects.assert_awaited_once_with(user=user)


##########################################################
# get_workspace
##########################################################


async def test_get_workspace():
    slug = "slug"
    with patch("taiga.workspaces.services.workspaces_repositories", autospec=True) as fake_workspaces_repo:
        await services.get_workspace(slug=slug)
        fake_workspaces_repo.get_workspace.assert_awaited_with(slug=slug)


##########################################################
# get_workspace_detail
##########################################################


async def test_get_workspaces_detail_for_admin():
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)

    with (patch("taiga.workspaces.services.workspaces_repositories", autospec=True) as fake_workspaces_repo,):
        await services.get_workspace_detail(id=workspace.id, user_id=user.id)
        fake_workspaces_repo.get_workspace_detail.assert_awaited_with(id=workspace.id, user_id=user.id)


async def test_get_workspaces_detail_for_member():
    user = await f.create_user()
    workspace = await f.create_workspace()

    with (patch("taiga.workspaces.services.workspaces_repositories", autospec=True) as fake_workspaces_repo,):
        await services.get_workspace_detail(id=workspace.id, user_id=user.id)
        fake_workspaces_repo.get_workspace_detail.assert_awaited_with(id=workspace.id, user_id=user.id)


##########################################################
# create_workspace
##########################################################


async def test_create_workspace():
    user = await f.create_user()
    name = "workspace1"
    color = 5
    with patch("taiga.workspaces.services.workspaces_repositories", autospec=True) as fake_workspaces_repo, patch(
        "taiga.workspaces.services.roles_repositories", autospec=True
    ) as fake_roles_repo:
        await services.create_workspace(name=name, color=color, owner=user)
        fake_workspaces_repo.create_workspace.assert_awaited_once()
        fake_roles_repo.create_workspace_role.assert_awaited_once()
        fake_roles_repo.create_workspace_membership.assert_awaited_once()
