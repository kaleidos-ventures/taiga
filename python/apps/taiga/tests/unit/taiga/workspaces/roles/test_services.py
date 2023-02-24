# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from unittest.mock import patch

import pytest
from taiga.workspaces.roles import services
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# get_workspace_role_name
##########################################################


async def test_get_workspace_role_name_none():
    user_id = None
    workspace = f.build_workspace()

    name = await services.get_workspace_role_name(user_id=user_id, workspace_id=workspace.id)
    assert name == "none"


async def test_get_workspace_role_name_admin():
    user = f.build_user()
    workspace = f.build_workspace(owner=user)
    role = f.build_workspace_role(is_admin=True)
    ws_membership = f.build_workspace_membership(role=role)

    with (
        patch("taiga.workspaces.roles.services.ws_memberships_repositories", autospec=True) as fake_ws_memberships_repo,
    ):
        fake_ws_memberships_repo.get_workspace_membership.return_value = ws_membership
        name = await services.get_workspace_role_name(workspace_id=workspace.id, user_id=user.id)
        assert name == "admin"
        fake_ws_memberships_repo.get_workspace_membership.assert_awaited_with(
            filters={"workspace_id": workspace.id, "user_id": user.id}, select_related=["role"]
        )


async def test_get_workspace_role_name_member():
    user = f.build_user()
    workspace = f.build_workspace(owner=user)
    role = f.build_workspace_role(is_admin=False)
    ws_membership = f.build_workspace_membership(role=role)

    with (
        patch("taiga.workspaces.roles.services.ws_memberships_repositories", autospec=True) as fake_ws_memberships_repo,
    ):
        fake_ws_memberships_repo.get_workspace_membership.return_value = ws_membership
        name = await services.get_workspace_role_name(workspace_id=workspace.id, user_id=user.id)
        assert name == "member"
        fake_ws_memberships_repo.get_workspace_membership.assert_awaited_with(
            filters={"workspace_id": workspace.id, "user_id": user.id}, select_related=["role"]
        )


async def test_get_workspace_role_name_guest():
    user = f.build_user()
    workspace = f.build_workspace(owner=user)

    with (
        patch("taiga.workspaces.roles.services.ws_memberships_repositories", autospec=True) as fake_ws_memberships_repo,
        patch("taiga.workspaces.roles.services.pj_memberships_repositories", autospec=True) as fake_pj_memberships_repo,
    ):
        fake_ws_memberships_repo.get_workspace_membership.return_value = None
        fake_pj_memberships_repo.exist_project_membership.return_value = True
        name = await services.get_workspace_role_name(workspace_id=workspace.id, user_id=user.id)
        assert name == "guest"
        fake_ws_memberships_repo.get_workspace_membership.assert_awaited_with(
            filters={"workspace_id": workspace.id, "user_id": user.id}, select_related=["role"]
        )
        fake_pj_memberships_repo.exist_project_membership.assert_awaited_with(
            filters={"project__workspace_id": workspace.id, "user_id": user.id},
        )


async def test_get_workspace_role_name_all_none():
    user = f.build_user()
    workspace = f.build_workspace(owner=user)

    with (
        patch("taiga.workspaces.roles.services.ws_memberships_repositories", autospec=True) as fake_ws_memberships_repo,
        patch("taiga.workspaces.roles.services.pj_memberships_repositories", autospec=True) as fake_pj_memberships_repo,
    ):
        fake_ws_memberships_repo.get_workspace_membership.return_value = None
        fake_pj_memberships_repo.exist_project_membership.return_value = False
        name = await services.get_workspace_role_name(workspace_id=workspace.id, user_id=user.id)
        assert name == "none"
        fake_ws_memberships_repo.get_workspace_membership.assert_awaited_with(
            filters={"workspace_id": workspace.id, "user_id": user.id}, select_related=["role"]
        )
        fake_pj_memberships_repo.exist_project_membership.assert_awaited_with(
            filters={"project__workspace_id": workspace.id, "user_id": user.id},
        )
