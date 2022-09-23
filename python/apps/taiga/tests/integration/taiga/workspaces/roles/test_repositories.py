# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from asgiref.sync import sync_to_async
from taiga.workspaces.memberships import repositories as memberships_repositories
from taiga.workspaces.roles import repositories as roles_repositories
from taiga.workspaces.roles.models import WorkspaceRole
from taiga.workspaces.workspaces.models import Workspace
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# get_user_workspace_role_name
##########################################################


@sync_to_async
def _get_ws_member_role(workspace: Workspace) -> WorkspaceRole:
    return workspace.roles.exclude(is_admin=True).first()


async def test_get_user_workspace_role_name_admin():
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)

    assert await roles_repositories.get_user_workspace_role_name(workspace.id, user.id) == "admin"


async def test_get_user_workspace_role_name_member():
    user = await f.create_user()
    workspace = await f.create_workspace()
    ws_member_role = await _get_ws_member_role(workspace=workspace)
    await f.create_workspace_membership(user=user, workspace=workspace, role=ws_member_role)

    assert await roles_repositories.get_user_workspace_role_name(workspace.id, user.id) == "member"


async def test_get_user_workspace_role_name_guest():
    user = await f.create_user()
    workspace = await f.create_workspace()
    await f.create_project(workspace=workspace, owner=user)

    assert await roles_repositories.get_user_workspace_role_name(workspace.id, user.id) == "guest"


async def test_get_user_workspace_role_name_none():
    user = await f.create_user()
    workspace = await f.create_workspace()

    assert await roles_repositories.get_user_workspace_role_name(workspace.id, user.id) == "none"


##########################################################
# get_workspace_role_for_user
##########################################################


async def test_get_workspace_role_for_user_admin():
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)
    role = await sync_to_async(workspace.roles.get)(slug="admin")

    assert await roles_repositories.get_workspace_role_for_user(user_id=user.id, workspace_id=workspace.id) == role


async def test_get_workspace_role_for_user_member():
    user = await f.create_user()
    workspace = await f.create_workspace()
    role = await sync_to_async(workspace.roles.exclude(slug="admin").first)()
    await memberships_repositories.create_workspace_membership(user=user, workspace=workspace, role=role)

    assert await roles_repositories.get_workspace_role_for_user(user_id=user.id, workspace_id=workspace.id) == role


async def test_get_workspace_role_for_user_none():
    user = await f.create_user()
    workspace = await f.create_workspace()

    assert await roles_repositories.get_workspace_role_for_user(user_id=user.id, workspace_id=workspace.id) is None
