# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from asgiref.sync import sync_to_async
from taiga.workspaces.memberships import repositories as memberships_repositories
from taiga.workspaces.roles import repositories as roles_repositories
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# create_workspace_role
##########################################################


async def test_create_workspace_role():
    workspace = await f.create_workspace()

    ws_role = await roles_repositories.create_workspace_role(
        workspace=workspace, name="super admin", slug="super-admin", permissions=["view_workspace"], is_admin=True
    )

    assert ws_role.name == "super admin"
    assert ws_role.workspace_id == workspace.id


##########################################################
# get_workspace_role
##########################################################


async def test_get_workspace_role_admin():
    user = await f.create_user()
    workspace = await f.create_workspace(created_by=user)
    role = await sync_to_async(workspace.roles.get)(slug="admin")

    assert (
        await roles_repositories.get_workspace_role(filters={"user_id": user.id, "workspace_id": workspace.id}) == role
    )


async def test_get_workspace_role_member():
    user = await f.create_user()
    workspace = await f.create_workspace()
    role = await sync_to_async(workspace.roles.exclude(slug="admin").first)()
    await memberships_repositories.create_workspace_membership(user=user, workspace=workspace, role=role)

    assert (
        await roles_repositories.get_workspace_role(filters={"user_id": user.id, "workspace_id": workspace.id}) == role
    )


async def test_get_workspace_role_none():
    user = await f.create_user()
    workspace = await f.create_workspace()

    assert (
        await roles_repositories.get_workspace_role(filters={"user_id": user.id, "workspace_id": workspace.id}) is None
    )
