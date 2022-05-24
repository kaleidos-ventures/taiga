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
# get_user_workspaces_overview
##########################################################


@sync_to_async
def _get_ws_member_role(workspace: Workspace) -> WorkspaceRole:
    return workspace.workspace_roles.exclude(is_admin=True).first()


@sync_to_async
def _get_ws_admin_role(workspace: Workspace) -> WorkspaceRole:
    return workspace.workspace_roles.filter(is_admin=True).first()


@sync_to_async
def _get_pj_member_role(project: Project) -> Role:
    return project.roles.get(slug="general")


@sync_to_async
def _save_project(project: Project) -> Project:
    return project.save()


@sync_to_async
def _save_role(role: Role) -> Role:
    return role.save()


async def test_get_user_workspaces_overview_latest_projects():
    user6 = await f.create_user()
    user7 = await f.create_user()

    # workspace premium, user6(ws-admin), user7(ws-member)
    workspace1 = await f.create_workspace(name="workspace1", owner=user6, is_premium=True)
    ws_member_role = await _get_ws_member_role(workspace=workspace1)
    await f.create_workspace_membership(user=user7, workspace=workspace1, workspace_role=ws_member_role)
    # user7 is a pj-owner
    await f.create_project(name="pj10", workspace=workspace1, owner=user7)
    # user7 is pj-member
    pj11 = await f.create_project(name="pj11", workspace=workspace1, owner=user6)
    pj_general_role = await _get_pj_member_role(project=pj11)
    await f.create_membership(user=user7, project=pj11, role=pj_general_role)
    # user7 is pj-member, ws-members have permissions
    pj12 = await f.create_project(name="pj12", workspace=workspace1, owner=user6)
    pj_general_role = await _get_pj_member_role(project=pj12)
    await f.create_membership(user=user7, project=pj12, role=pj_general_role)
    pj_general_role.permissions = []
    await _save_role(role=pj_general_role)
    pj12.workspace_member_permissions = ["view_us"]
    await _save_project(project=pj12)
    # user7 is pj-member, ws-members dont have permissions
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
    # user7 is pj-member
    pj51 = await f.create_project(name="pj51", workspace=workspace5, owner=user6)
    pj_general_role = await _get_pj_member_role(project=pj51)
    await f.create_membership(user=user7, project=pj51, role=pj_general_role)
    # user7 is pj-member, ws-members dont have permissions
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

    res = await repositories.get_user_workspaces_overview(user6)

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

    res = await repositories.get_user_workspaces_overview(user7)

    assert len(res) == 5  # workspaces

    names = [ws.name for ws in res]
    assert "workspace7" not in names

    for ws in res:
        if ws.name == workspace1.name:
            assert ws.total_projects == 5
        elif ws.name == workspace2.name:
            assert ws.total_projects == 0
            assert ws.has_projects is True
        elif ws.name == workspace3.name:
            assert ws.total_projects == 0
            assert ws.has_projects is False
        elif ws.name == workspace4.name:
            assert ws.total_projects == 0
        elif ws.name == workspace5.name:
            assert ws.total_projects == 3


async def test_get_user_workspaces_overview_invited_projects():
    user8 = await f.create_user()
    user9 = await f.create_user()

    # user8 is admin of several workspaces
    ws1 = await f.create_workspace(name="ws1 for admin", owner=user8, is_premium=True)
    ws1_admin_role = await _get_ws_admin_role(workspace=ws1)
    ws2 = await f.create_workspace(name="ws2 for member", owner=user8, is_premium=True)
    ws2_member_role = await _get_ws_member_role(workspace=ws2)
    ws3 = await f.create_workspace(name="ws2 for guest", owner=user8, is_premium=True)
    ws4 = await f.create_workspace(name="ws2 for invited", owner=user8, is_premium=True)

    # user9 is admin of ws1 as well
    await f.create_workspace_membership(user=user9, workspace=ws1, workspace_role=ws1_admin_role)
    # user9 is member of ws2 as well
    await f.create_workspace_membership(user=user9, workspace=ws2, workspace_role=ws2_member_role)
    # user9 is guest of ws3
    pj = await f.create_project(name="pj1", workspace=ws3, owner=user8)
    pj_general_role = await _get_pj_member_role(project=pj)
    await f.create_membership(user=user9, project=pj, role=pj_general_role)

    # user8 invites user9 to a project in ws1
    pj = await f.create_project(name="pj2", workspace=ws1, owner=user8)
    pj_general_role = await _get_pj_member_role(project=pj)
    await f.create_invitation(email=user9.email, user=user9, project=pj, role=pj_general_role, invited_by=user8)

    # user8 invites user9 to a project in ws2
    pj = await f.create_project(name="pj3", workspace=ws2, owner=user8)
    pj_general_role = await _get_pj_member_role(project=pj)
    await f.create_invitation(email=user9.email, user=user9, project=pj, role=pj_general_role, invited_by=user8)

    # user8 invites user9 to a project in ws3
    pj = await f.create_project(name="pj4", workspace=ws3, owner=user8)
    pj_general_role = await _get_pj_member_role(project=pj)
    await f.create_invitation(email=user9.email, user=user9, project=pj, role=pj_general_role, invited_by=user8)

    # user8 invites user9 to a project in ws4
    pj = await f.create_project(name="pj5", workspace=ws4, owner=user8)
    pj_general_role = await _get_pj_member_role(project=pj)
    await f.create_invitation(email=user9.email, user=user9, project=pj, role=pj_general_role, invited_by=user8)

    res = await repositories.get_user_workspaces_overview(user9)

    assert len(res) == 4  # workspaces
    for ws in res:
        assert len(ws.invited_projects) == 1


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
# get_workspace_detail
##########################################################


async def test_get_workspace_detail_premium_projects_ws_member():
    user8 = await f.create_user()
    user9 = await f.create_user()

    # workspace premium, user8(ws-admin), user9(ws-member)
    workspace1 = await f.create_workspace(name="workspace1", owner=user8, is_premium=True)
    ws_member_role = await _get_ws_member_role(workspace=workspace1)
    await f.create_workspace_membership(user=user9, workspace=workspace1, workspace_role=ws_member_role)
    # user9 is a pj-owner
    await f.create_project(name="pj10", workspace=workspace1, owner=user9)
    # user9 is pj-member
    pj11 = await f.create_project(name="pj11", workspace=workspace1, owner=user8)
    pj_general_role = await _get_pj_member_role(project=pj11)
    await f.create_membership(user=user9, project=pj11, role=pj_general_role)
    # user9 is pj-member, ws-members have permissions
    pj12 = await f.create_project(name="pj12", workspace=workspace1, owner=user8)
    pj_general_role = await _get_pj_member_role(project=pj12)
    await f.create_membership(user=user9, project=pj12, role=pj_general_role)
    pj_general_role.permissions = []
    await _save_role(role=pj_general_role)
    pj12.workspace_member_permissions = ["view_us"]
    await _save_project(project=pj12)
    # user9 is pj-member, ws-members dont have permissions
    pj13 = await f.create_project(name="pj13", workspace=workspace1, owner=user8)
    pj_general_role = await _get_pj_member_role(project=pj13)
    await f.create_membership(user=user9, project=pj13, role=pj_general_role)
    pj_general_role.permissions = []
    await _save_role(role=pj_general_role)
    # user9 is not a pj-member but the project allows 'view_us' to ws-members
    pj14 = await f.create_project(name="pj14", workspace=workspace1, owner=user8)
    pj14.workspace_member_permissions = ["view_us"]
    await _save_project(project=pj14)
    # user9 is not a pj-member and ws-members are not allowed
    await f.create_project(name="pj15", workspace=workspace1, owner=user8)
    # user9 is not a pj-member and ws-members are not allowed
    await f.create_project(workspace=workspace1, owner=user8)

    # assert workspace1 - user8
    res_ws = await repositories.get_workspace_detail(id=workspace1.id, user_id=user8.id)
    assert res_ws == workspace1
    assert res_ws.total_projects == 7
    assert res_ws.is_owner is True
    assert res_ws.has_projects is True
    assert res_ws.my_role == "admin"
    # assert workspace1 - user9
    res_ws = await repositories.get_workspace_detail(id=workspace1.id, user_id=user9.id)
    assert res_ws == workspace1
    assert res_ws.total_projects == 5
    assert res_ws.is_owner is False
    assert res_ws.has_projects is True
    assert res_ws.my_role == "member"


async def test_get_workspace_detail_premium_no_projects():
    user10 = await f.create_user()
    user11 = await f.create_user()

    # workspace premium, user10(ws-admin), user11(ws-member, has_projects: false)
    workspace3 = await f.create_workspace(name="workspace3", owner=user10, is_premium=True)
    ws_member_role = await _get_ws_member_role(workspace=workspace3)
    await f.create_workspace_membership(user=user11, workspace=workspace3, workspace_role=ws_member_role)

    # assert workspace3 - user10
    res_ws = await repositories.get_workspace_detail(id=workspace3.id, user_id=user10.id)
    assert res_ws == workspace3
    assert res_ws.total_projects == 0
    assert res_ws.is_owner is True
    assert res_ws.has_projects is False
    assert res_ws.my_role == "admin"
    # assert workspace3 - user11
    res_ws = await repositories.get_workspace_detail(id=workspace3.id, user_id=user11.id)
    assert res_ws == workspace3
    assert res_ws.total_projects == 0
    assert res_ws.is_owner is False
    assert res_ws.has_projects is False
    assert res_ws.my_role == "member"


async def test_get_workspace_detail_no_premium_no_projects():
    user12 = await f.create_user()

    # workspace no premium, user12(ws-admin), empty
    workspace4 = await f.create_workspace(name="workspace4", owner=user12, is_premium=False)
    res_ws = await repositories.get_workspace_detail(id=workspace4.id, user_id=user12.id)
    assert res_ws == workspace4
    assert res_ws.total_projects == 0
    assert res_ws.is_owner is True
    assert res_ws.has_projects is False
    assert res_ws.my_role == "admin"


async def test_get_workspace_detail_premium_projects_no_ws_member():
    user13 = await f.create_user()
    user14 = await f.create_user()

    # workspace premium, user13(ws-admin), user14(NOT ws-member)
    workspace5 = await f.create_workspace(name="workspace5", owner=user13, is_premium=True)
    # user14 is a pj-owner
    await f.create_project(name="pj50", workspace=workspace5, owner=user14)
    # user14 is pj-member
    pj51 = await f.create_project(name="pj51", workspace=workspace5, owner=user13)
    pj_general_role = await _get_pj_member_role(project=pj51)
    await f.create_membership(user=user14, project=pj51, role=pj_general_role)
    # user14 is pj-member, ws-members dont have permissions
    pj52 = await f.create_project(name="pj52", workspace=workspace5, owner=user13)
    pj_general_role = await _get_pj_member_role(project=pj52)
    await f.create_membership(user=user14, project=pj52, role=pj_general_role)
    pj_general_role.permissions = []
    await _save_role(role=pj_general_role)
    # user14 is not a pj-member
    await f.create_project(name="pj53", workspace=workspace5, owner=user13)

    # assert workspace5 - user13
    res_ws = await repositories.get_workspace_detail(id=workspace5.id, user_id=user13.id)
    assert res_ws == workspace5
    assert res_ws.total_projects == 4
    assert res_ws.is_owner is True
    assert res_ws.has_projects is True
    assert res_ws.my_role == "admin"
    # assert workspace5 - user14
    res_ws = await repositories.get_workspace_detail(id=workspace5.id, user_id=user14.id)
    assert res_ws == workspace5
    assert res_ws.total_projects == 3
    assert res_ws.is_owner is False
    assert res_ws.has_projects is True
    assert res_ws.my_role == "guest"


async def test_get_workspace_detail_premium_no_projects_no_ws_member():
    user15 = await f.create_user()
    user16 = await f.create_user()

    # workspace premium, user15(ws-admin), user16(NOT ws-member)
    workspace6 = await f.create_workspace(name="workspace6", owner=user15, is_premium=True)
    # user16 is NOT a pj-member
    await f.create_project(workspace=workspace6, owner=user15)

    # assert workspace6 - user15
    res_ws = await repositories.get_workspace_detail(id=workspace6.id, user_id=user15.id)
    assert res_ws == workspace6
    assert res_ws.total_projects == 1
    assert res_ws.is_owner is True
    assert res_ws.has_projects is True
    assert res_ws.my_role == "admin"
    # assert workspace6 - user16
    res_ws = await repositories.get_workspace_detail(id=workspace6.id, user_id=user16.id)
    assert res_ws == workspace6
    assert res_ws.total_projects == 0
    assert res_ws.is_owner is False
    assert res_ws.has_projects is True
    assert res_ws.my_role == "none"


async def test_get_workspace_detail_no_ws_members():
    user17 = await f.create_user()
    user18 = await f.create_user()

    # workspace that shouldn't appear to anyone
    workspace7 = await f.create_workspace(name="workspace7", is_premium=True)
    # user17 and user18 are NOT pj-member
    await f.create_project(workspace=workspace7)

    # assert workspace7 - user17
    res_ws = await repositories.get_workspace_detail(id=workspace7.id, user_id=user17.id)
    assert res_ws == workspace7
    assert res_ws.total_projects == 0
    assert res_ws.is_owner is False
    assert res_ws.has_projects is True
    assert res_ws.my_role == "none"
    # assert workspace7 - user18
    res_ws = await repositories.get_workspace_detail(id=workspace7.id, user_id=user18.id)
    assert res_ws == workspace7
    assert res_ws.total_projects == 0
    assert res_ws.is_owner is False
    assert res_ws.has_projects is True
    assert res_ws.my_role == "none"


##########################################################
# get_workspace_summary
##########################################################


async def test_get_workspace_summary_admin():
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)
    res = await repositories.get_workspace_summary(id=workspace.id, user_id=user.id)

    assert res.name == workspace.name
    assert res.my_role == "admin"


async def test_get_workspace_summary_member():
    user = await f.create_user()
    workspace = await f.create_workspace()
    ws_member_role = await _get_ws_member_role(workspace=workspace)
    await f.create_workspace_membership(user=user, workspace=workspace, workspace_role=ws_member_role)
    res = await repositories.get_workspace_summary(id=workspace.id, user_id=user.id)

    assert res.name == workspace.name
    assert res.my_role == "member"


async def test_get_workspace_summary_guest():
    user = await f.create_user()
    workspace = await f.create_workspace()
    await f.create_project(owner=user, workspace=workspace)
    res = await repositories.get_workspace_summary(id=workspace.id, user_id=user.id)

    assert res.name == workspace.name
    assert res.my_role == "guest"


async def test_get_workspace_summary_none():
    user = await f.create_user()
    workspace = await f.create_workspace()
    res = await repositories.get_workspace_summary(id=workspace.id, user_id=user.id)

    assert res.name == workspace.name
    assert res.my_role == "none"


async def test_get_workspace_summary_non_existing():
    user = await f.create_user()
    non_existing_ws_id = (await f.create_workspace()).id + 1000
    res = await repositories.get_workspace_summary(id=non_existing_ws_id, user_id=user.id)

    assert res is None
