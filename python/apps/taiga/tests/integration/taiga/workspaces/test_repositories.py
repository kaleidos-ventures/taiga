# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


import pytest
from asgiref.sync import sync_to_async
from taiga.projects.models import Project
from taiga.roles.models import Role, WorkspaceRole
from taiga.workspaces import repositories
from taiga.workspaces.models import Workspace
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# create_workspace
##########################################################


async def test_create_workspace_with_non_ASCI_chars():
    user = await f.create_user()
    workspace = await repositories.create_workspace(name="My w0r#%&乕شspace", color=3, owner=user)
    assert workspace.slug.startswith("my-w0rhu-shspace")


##########################################################
# get_workspace
##########################################################


async def test_get_workspace_return_workspace():
    workspace = await f.create_workspace(name="ws 1")
    assert await repositories.get_workspace(slug=workspace.slug) == workspace


async def test_get_workspace_return_none():
    await f.create_workspace(name="ws 1")
    assert await repositories.get_workspace(slug="ws-not-exist") is None


##########################################################
# get_user_workspaces_with_latest_projects
##########################################################


@sync_to_async
def _get_ws_member_role(workspace: Workspace) -> WorkspaceRole:
    return workspace.workspace_roles.exclude(is_admin=True).first()


@sync_to_async
def _get_pj_member_role(project: Project) -> Role:
    return project.roles.get(slug="general")


@sync_to_async
def _save_project(project: Project) -> Project:
    return project.save()


@sync_to_async
def _save_role(role: Role) -> Role:
    return role.save()


async def test_get_user_workspaces_with_latest_projects():
    user6 = await f.create_user()
    user7 = await f.create_user()

    # workspace premium, user6(ws-admin), user7(ws-member)
    workspace1 = await f.create_workspace(name="workspace1", owner=user6, is_premium=True)
    ws_member_role = await _get_ws_member_role(workspace=workspace1)
    await f.create_workspace_membership(user=user7, workspace=workspace1, workspace_role=ws_member_role)
    # user7 is a pj-owner
    await f.create_project(name="pj10", workspace=workspace1, owner=user7)
    # user7 is pj-member with access
    pj11 = await f.create_project(name="pj11", workspace=workspace1, owner=user6)
    pj_general_role = await _get_pj_member_role(project=pj11)
    await f.create_membership(user=user7, project=pj11, role=pj_general_role)
    # user7 is pj-member but its role has no-access, ws-members have permissions
    pj12 = await f.create_project(name="pj12", workspace=workspace1, owner=user6)
    pj_general_role = await _get_pj_member_role(project=pj12)
    await f.create_membership(user=user7, project=pj12, role=pj_general_role)
    pj_general_role.permissions = []
    await _save_role(role=pj_general_role)
    pj12.workspace_member_permissions = ["view_us"]
    await _save_project(project=pj12)
    # user7 is pj-member but its role has no-access, ws-members dont have permissions
    pj13 = await f.create_project(name="pj13", workspace=workspace1, owner=user6)
    pj_general_role = await _get_pj_member_role(project=pj13)
    await f.create_membership(user=user7, project=pj13, role=pj_general_role)
    pj_general_role.permissions = []
    await _save_role(role=pj_general_role)
    # user7 is not a pj-member but the project allows 'view_us' to ws-members
    pj14 = await f.create_project(name="pj14", workspace=workspace1, owner=user6)
    pj14.workspace_member_permissions = ["view_us"]
    await _save_project(project=pj14)
    # user7 is not a pj-member and ws-members are not allowed
    await f.create_project(name="pj15", workspace=workspace1, owner=user6)

    # workspace premium, user6(ws-admin), user7(ws-member, has_projects: true)
    workspace2 = await f.create_workspace(name="workspace2", owner=user6, is_premium=True)
    ws_member_role = await _get_ws_member_role(workspace=workspace2)
    await f.create_workspace_membership(user=user7, workspace=workspace2, workspace_role=ws_member_role)
    # user7 is not a pj-member and ws-members are not allowed
    await f.create_project(workspace=workspace2, owner=user6)

    # workspace premium, user6(ws-admin), user7(ws-member, has_projects: false)
    workspace3 = await f.create_workspace(name="workspace3", owner=user6, is_premium=True)
    ws_member_role = await _get_ws_member_role(workspace=workspace3)
    await f.create_workspace_membership(user=user7, workspace=workspace3, workspace_role=ws_member_role)

    # workspace no premium, user7(ws-admin), empty
    workspace4 = await f.create_workspace(name="workspace4", owner=user7, is_premium=False)

    # workspace premium, user6(ws-admin), user7(NOT ws-member)
    workspace5 = await f.create_workspace(name="workspace5", owner=user6, is_premium=True)
    # user7 is a pj-owner
    await f.create_project(name="pj50", workspace=workspace5, owner=user7)
    # user7 is pj-member with access
    pj51 = await f.create_project(name="pj51", workspace=workspace5, owner=user6)
    pj_general_role = await _get_pj_member_role(project=pj51)
    await f.create_membership(user=user7, project=pj51, role=pj_general_role)
    # user7 is pj-member but its role has no-access, ws-members dont have permissions
    pj52 = await f.create_project(name="pj52", workspace=workspace5, owner=user6)
    pj_general_role = await _get_pj_member_role(project=pj52)
    await f.create_membership(user=user7, project=pj52, role=pj_general_role)
    pj_general_role.permissions = []
    await _save_role(role=pj_general_role)
    # user7 is not a pj-member
    await f.create_project(name="pj53", workspace=workspace5, owner=user6)

    # workspace premium, user6(ws-admin), user7(NOT ws-member)
    workspace6 = await f.create_workspace(name="workspace6", owner=user6, is_premium=True)
    # user7 is NOT a pj-member
    await f.create_project(workspace=workspace6, owner=user6)

    # workspace that shouldnt appear to anyone
    workspace7 = await f.create_workspace(name="workspace7", is_premium=True)
    # user6 and user7 are NOT pj-member
    await f.create_project(workspace=workspace7)

    res = await repositories.get_user_workspaces_with_latest_projects(user6)

    assert len(res) == 5  # workspaces

    names = [ws.name for ws in res]
    assert "workspace7" not in names

    for ws in res:
        if ws.name == workspace1.name:
            assert ws.total_projects == 6
        elif ws.name == workspace2.name:
            assert ws.total_projects == 1
        elif ws.name == workspace3.name:
            assert ws.total_projects == 0
            assert ws.has_projects is False
        elif ws.name == workspace5.name:
            assert ws.total_projects == 4
        elif ws.name == workspace6.name:
            assert ws.total_projects == 1

    res = await repositories.get_user_workspaces_with_latest_projects(user7)

    assert len(res) == 5  # workspaces

    names = [ws.name for ws in res]
    assert "workspace7" not in names

    for ws in res:
        if ws.name == workspace1.name:
            assert ws.total_projects == 3
        elif ws.name == workspace2.name:
            assert ws.total_projects == 0
            assert ws.has_projects is True
        elif ws.name == workspace3.name:
            assert ws.total_projects == 0
            assert ws.has_projects is False
        elif ws.name == workspace4.name:
            assert ws.total_projects == 0
        elif ws.name == workspace5.name:
            assert ws.total_projects == 2
