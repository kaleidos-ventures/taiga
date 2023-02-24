# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import uuid

import pytest
from asgiref.sync import sync_to_async
from taiga.workspaces.memberships import repositories
from taiga.workspaces.roles.models import WorkspaceRole
from taiga.workspaces.workspaces.models import Workspace
from tests.utils import factories as f

pytestmark = pytest.mark.django_db(transaction=True)


##########################################################
# utils
##########################################################


@sync_to_async
def _get_ws_member_role(workspace: Workspace) -> WorkspaceRole:
    return workspace.roles.exclude(is_admin=True).first()


##########################################################
# create_workspace_memberhip
##########################################################


async def test_create_workspace_membership():
    user = await f.create_user()
    workspace = await f.create_workspace()
    ws_role = await _get_ws_member_role(workspace=workspace)

    membership = await repositories.create_workspace_membership(user=user, workspace=workspace, role=ws_role)

    assert membership.user_id == user.id
    assert membership.workspace_id == workspace.id
    assert membership.role_id == ws_role.id


##########################################################
# get_workspace_membership
##########################################################


async def test_get_workspace_membership():
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)

    membership = await repositories.get_workspace_membership(
        filters={"user_id": user.id, "workspace_id": workspace.id}, select_related=["workspace", "user"]
    )
    assert membership.workspace == workspace
    assert membership.user == user


async def test_get_workspace_membership_none():
    membership = await repositories.get_workspace_membership(
        filters={"user_id": uuid.uuid1(), "workspace_id": uuid.uuid1()}
    )
    assert membership is None
