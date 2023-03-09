# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import uuid
from unittest import IsolatedAsyncioTestCase

import pytest
from asgiref.sync import sync_to_async
from taiga.projects.projects.models import Project
from taiga.projects.roles.models import ProjectRole
from taiga.workspaces.workspaces import repositories
from tests.utils import factories as f

pytestmark = pytest.mark.django_db

##########################################################
# create_workspace
##########################################################


async def test_create_workspace_with_non_ASCI_chars():
    user = await f.create_user()
    workspace = await repositories.create_workspace(name="My w0r#%&乕شspace", color=3, created_by=user)
    assert workspace.name == "My w0r#%&乕شspace"


##########################################################
# get_workspace
##########################################################


async def test_get_workspace_return_workspace():
    workspace = await f.create_workspace(name="ws 1")
    assert await repositories.get_workspace(filters={"id": workspace.id}) == workspace


async def test_get_workspace_return_none():
    non_existing_ws_id = uuid.uuid1()
    await f.create_workspace(name="ws 1")
    assert await repositories.get_workspace(filters={"id": non_existing_ws_id}) is None


##########################################################
# get_workspace_detail
##########################################################


async def test_get_workspace_detail_no_projects():
    user12 = await f.create_user()

    # workspace, user12(ws-admin), empty
    workspace4 = await f.create_workspace(name="workspace4", created_by=user12)
    res_ws = await repositories.get_workspace_detail(
        user_id=user12.id,
        filters={"id": workspace4.id},
    )
    assert res_ws == workspace4
    assert res_ws.has_projects is False


async def test_get_workspace_detail_projects():
    user13 = await f.create_user()
    user14 = await f.create_user()

    # workspace, user13(ws-admin)
    workspace5 = await f.create_workspace(name="workspace5", created_by=user13)
    # user14 is a pj-admin
    await f.create_project(name="pj50", workspace=workspace5, created_by=user14)
    # user14 is pj-member
    pj51 = await f.create_project(name="pj51", workspace=workspace5, created_by=user13)
    pj_general_role = await _get_pj_member_role(project=pj51)
    await f.create_project_membership(user=user14, project=pj51, role=pj_general_role)
    # user14 is pj-member, ws-members dont have permissions
    pj52 = await f.create_project(name="pj52", workspace=workspace5, created_by=user13)
    pj_general_role = await _get_pj_member_role(project=pj52)
    await f.create_project_membership(user=user14, project=pj52, role=pj_general_role)
    pj_general_role.permissions = []
    await _save_role(role=pj_general_role)
    # user14 is not a pj-member
    await f.create_project(name="pj53", workspace=workspace5, created_by=user13)

    # assert workspace5 - user13
    res_ws = await repositories.get_workspace_detail(
        user_id=user13.id,
        filters={"id": workspace5.id},
    )
    assert res_ws == workspace5
    assert res_ws.has_projects is True
    # assert workspace5 - user14
    res_ws = await repositories.get_workspace_detail(
        user_id=user14.id,
        filters={"id": workspace5.id},
    )
    assert res_ws == workspace5
    assert res_ws.has_projects is True


##########################################################
# get_workspace_summary
##########################################################


async def test_get_workspace_summary():
    workspace = await f.create_workspace()
    res = await repositories.get_workspace_summary(
        filters={"id": workspace.id},
    )
    assert res.name == workspace.name


async def test_get_workspace_summary_non_existing():
    non_existing_ws_id = uuid.uuid1()
    res = await repositories.get_workspace_summary(
        filters={"id": non_existing_ws_id},
    )

    assert res is None


##########################################################
# update workspace
##########################################################


async def test_update_workspace():
    workspace = await f.create_workspace()
    updated_workspace = await repositories.update_workspace(
        workspace=workspace,
        values={"name": "New name"},
    )
    assert updated_workspace.name == "New name"


##########################################################
# misc - get_user_workspaces_overview
##########################################################


@sync_to_async
def _get_pj_member_role(project: Project) -> ProjectRole:
    return project.roles.get(slug="general")


@sync_to_async
def _save_project(project: Project) -> Project:
    return project.save()


@sync_to_async
def _save_role(role: ProjectRole) -> ProjectRole:
    return role.save()


async def test_get_user_workspaces_overview_latest_projects():
    user6 = await f.create_user()
    user7 = await f.create_user()

    # workspace, user6(ws-admin), user7(ws-member)
    workspace1 = await f.create_workspace(name="workspace1", created_by=user6)
    await f.create_workspace_membership(user=user7, workspace=workspace1, is_admin=False)
    # user7 is a pj-admin
    await f.create_project(name="pj10", workspace=workspace1, created_by=user7)
    # user7 is pj-member
    pj11 = await f.create_project(name="pj11", workspace=workspace1, created_by=user6)
    pj_general_role = await _get_pj_member_role(project=pj11)
    await f.create_project_membership(user=user7, project=pj11, role=pj_general_role)
    # user7 is pj-member, ws-members have permissions
    pj12 = await f.create_project(name="pj12", workspace=workspace1, created_by=user6)
    pj_general_role = await _get_pj_member_role(project=pj12)
    await f.create_project_membership(user=user7, project=pj12, role=pj_general_role)
    pj_general_role.permissions = []
    await _save_role(role=pj_general_role)
    await _save_project(project=pj12)
    # user7 is pj-member, ws-members dont have permissions
    pj13 = await f.create_project(name="pj13", workspace=workspace1, created_by=user6)
    pj_general_role = await _get_pj_member_role(project=pj13)
    await f.create_project_membership(user=user7, project=pj13, role=pj_general_role)
    pj_general_role.permissions = []
    await _save_role(role=pj_general_role)
    # user7 is not a pj-member but the project allows 'view_story' to ws-members
    pj14 = await f.create_project(name="pj14", workspace=workspace1, created_by=user6)
    await _save_project(project=pj14)
    # user7 is not a pj-member and ws-members are not allowed
    await f.create_project(name="pj15", workspace=workspace1, created_by=user6)

    # workspace, user6(ws-admin), user7(ws-member, has_projects: true)
    workspace2 = await f.create_workspace(name="workspace2", created_by=user6)
    await f.create_workspace_membership(user=user7, workspace=workspace2, is_admin=False)
    # user7 is not a pj-member and ws-members are not allowed
    await f.create_project(workspace=workspace2, created_by=user6)

    # workspace, user6(ws-admin), user7(ws-member, has_projects: false)
    workspace3 = await f.create_workspace(name="workspace3", created_by=user6)
    await f.create_workspace_membership(user=user7, workspace=workspace3, is_admin=False)

    # workspace, user7(ws-admin), empty
    workspace4 = await f.create_workspace(name="workspace4", created_by=user7)

    # workspace, user6(ws-admin), user7(NOT ws-member)
    workspace5 = await f.create_workspace(name="workspace5", created_by=user6)
    # user7 is a pj-admin
    await f.create_project(name="pj50", workspace=workspace5, created_by=user7)
    # user7 is pj-member
    pj51 = await f.create_project(name="pj51", workspace=workspace5, created_by=user6)
    pj_general_role = await _get_pj_member_role(project=pj51)
    await f.create_project_membership(user=user7, project=pj51, role=pj_general_role)
    # user7 is pj-member, ws-members dont have permissions
    pj52 = await f.create_project(name="pj52", workspace=workspace5, created_by=user6)
    pj_general_role = await _get_pj_member_role(project=pj52)
    await f.create_project_membership(user=user7, project=pj52, role=pj_general_role)
    pj_general_role.permissions = []
    await _save_role(role=pj_general_role)
    # user7 is not a pj-member
    await f.create_project(name="pj53", workspace=workspace5, created_by=user6)

    # workspace, user6(ws-admin), user7(NOT ws-member)
    workspace6 = await f.create_workspace(name="workspace6", created_by=user6)
    # user7 is NOT a pj-member
    await f.create_project(workspace=workspace6, created_by=user6)

    # workspace that shouldnt appear to anyone
    workspace7 = await f.create_workspace(name="workspace7")
    # user6 and user7 are NOT pj-member
    await f.create_project(workspace=workspace7)

    res = await repositories.list_user_workspaces_overview(user6)

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

    res = await repositories.list_user_workspaces_overview(user7)

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
    user10 = await f.create_user()

    # user8 is admin of several workspaces
    ws1 = await f.create_workspace(name="ws1 for admin", created_by=user8)
    ws2 = await f.create_workspace(name="ws2 for member", created_by=user8)
    ws3 = await f.create_workspace(name="ws2 for guest", created_by=user8)
    ws4 = await f.create_workspace(name="ws2 for invited", created_by=user8)

    # user9 is admin of ws1 as well
    await f.create_workspace_membership(user=user9, workspace=ws1, is_admin=True)
    # user9 is member of ws2 as well
    await f.create_workspace_membership(user=user9, workspace=ws2, is_admin=False)
    # user9 is guest of ws3
    pj = await f.create_project(name="pj1", workspace=ws3, created_by=user8)
    pj_general_role = await _get_pj_member_role(project=pj)
    await f.create_project_membership(user=user9, project=pj, role=pj_general_role)

    # user8 invites user9 to a project in ws1
    pj = await f.create_project(name="pj2", workspace=ws1, created_by=user8)
    pj_general_role = await _get_pj_member_role(project=pj)
    await f.create_project_invitation(email=user9.email, user=user9, project=pj, role=pj_general_role, invited_by=user8)

    # user8 invites user9 to a project in ws2 (just email)
    pj = await f.create_project(name="pj3", workspace=ws2, created_by=user8)
    pj_general_role = await _get_pj_member_role(project=pj)
    await f.create_project_invitation(email=user9.email, user=None, project=pj, role=pj_general_role, invited_by=user8)

    # user8 invites user9 and user10 to a project in ws3
    pj = await f.create_project(name="pj4", workspace=ws3, created_by=user8)
    pj_general_role = await _get_pj_member_role(project=pj)
    await f.create_project_invitation(email=user9.email, user=user9, project=pj, role=pj_general_role, invited_by=user8)
    await f.create_project_invitation(
        email=user10.email, user=user10, project=pj, role=pj_general_role, invited_by=user8
    )

    # user8 invites user9 and user10 to a project in ws4 (just email)
    pj = await f.create_project(name="pj5", workspace=ws4, created_by=user8)
    pj_general_role = await _get_pj_member_role(project=pj)
    await f.create_project_invitation(email=user9.email, user=None, project=pj, role=pj_general_role, invited_by=user8)
    await f.create_project_invitation(email=user10.email, user=None, project=pj, role=pj_general_role, invited_by=user8)

    # user 9
    res = await repositories.list_user_workspaces_overview(user9)

    assert len(res) == 4  # workspaces
    for ws in res:
        assert len(ws.invited_projects) == 1

    # user 10
    res = await repositories.list_user_workspaces_overview(user10)

    assert len(res) == 2  # workspaces
    for ws in res:
        assert len(ws.invited_projects) == 1


##########################################################
# delete_workspace
##########################################################


async def test_delete_workspaces_without_ws_members():
    workspace = await f.create_workspace()

    num_deleted_wss = await repositories.delete_workspaces(filters={"id": workspace.id})
    assert num_deleted_wss == 4  # 1 workspace, 2 ws_roles (admin/member), 1 ws_memberships (admin-ws.created_by)


async def test_delete_workspaces_with_ws_members():
    workspace = await f.create_workspace()

    ws_member = await f.create_user()
    await f.create_workspace_membership(user=ws_member, workspace=workspace, is_admin=False)

    num_deleted_wss = await repositories.delete_workspaces(filters={"id": workspace.id})
    assert num_deleted_wss == 5  # 1 workspace, 2 ws_roles, 2 ws_memberships (ws.created_by, ws_member)


##########################################################
# misc - get_user_workspace_overview
##########################################################


class GetUserWorkspaceOverview(IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.user1 = await f.create_user()
        self.user2 = await f.create_user()
        self.user3 = await f.create_user()

    async def _asyncSetUp_workspace1(self):
        # workspace1: self.user1(ws-admin), self.user2(ws-member)
        workspace1 = await f.create_workspace(name="workspace1", created_by=self.user1)
        await f.create_workspace_membership(user=self.user2, workspace=workspace1, is_admin=False)
        # self.user2 is a pj-admin
        await f.create_project(name="pj10", workspace=workspace1, created_by=self.user2)
        # self.user2 is pj-member
        pj11 = await f.create_project(name="pj11", workspace=workspace1, created_by=self.user1)
        pj_general_role = await _get_pj_member_role(project=pj11)
        await f.create_project_membership(user=self.user2, project=pj11, role=pj_general_role)
        # self.user3 is pj-guest
        await f.create_project_invitation(
            email=self.user3.email, user=self.user3, project=pj11, role=pj_general_role, invited_by=self.user1
        )

        # self.user2 is pj-member, ws-members have permissions
        pj12 = await f.create_project(name="pj12", workspace=workspace1, created_by=self.user1)
        pj_general_role = await _get_pj_member_role(project=pj12)
        await f.create_project_membership(user=self.user2, project=pj12, role=pj_general_role)
        pj_general_role.permissions = []
        await _save_role(role=pj_general_role)
        await _save_project(project=pj12)
        # self.user3 is pj-guest
        await f.create_project_invitation(
            email=self.user3.email, user=self.user3, project=pj12, role=pj_general_role, invited_by=self.user2
        )
        # self.user2 is pj-member, ws-members dont have permissions
        pj13 = await f.create_project(name="pj13", workspace=workspace1, created_by=self.user1)
        pj_general_role = await _get_pj_member_role(project=pj13)
        await f.create_project_membership(user=self.user2, project=pj13, role=pj_general_role)
        pj_general_role.permissions = []
        await _save_role(role=pj_general_role)
        # self.user2 is not a pj-member but the project allows 'view_story' to ws-members
        pj14 = await f.create_project(name="pj14", workspace=workspace1, created_by=self.user1)
        await _save_project(project=pj14)
        # self.user2 is not a pj-member and ws-members are not allowed
        await f.create_project(name="pj15", workspace=workspace1, created_by=self.user1)
        # self.user2 is a pj-admin
        pj16 = await f.create_project(name="pj16", workspace=workspace1, created_by=self.user2)
        pj_general_role = await _get_pj_member_role(project=pj16)
        # self.user1 is pj-guest
        await f.create_project_invitation(
            email=self.user1.email, user=self.user1, project=pj16, role=pj_general_role, invited_by=self.user2
        )
        # self.user3 is pj-guest
        await f.create_project_invitation(
            email=self.user3.email, user=self.user3, project=pj16, role=pj_general_role, invited_by=self.user2
        )
        self.workspace1 = workspace1

    async def _asyncSetUp_workspace2(self):
        # workspace2, self.user1(ws-admin), self.user2(ws-member, has_projects: true)
        workspace2 = await f.create_workspace(name="workspace2", created_by=self.user1)
        await f.create_workspace_membership(user=self.user2, workspace=workspace2, is_admin=False)
        # self.user2 is not a pj-member and ws-members are not allowed
        await f.create_project(workspace=workspace2, created_by=self.user1)
        self.workspace2 = workspace2

    async def _asyncSetUp_workspace3(self):
        # workspace3, self.user1(ws-admin), self.user2(ws-member, has_projects: false)
        workspace3 = await f.create_workspace(name="workspace3", created_by=self.user1)
        await f.create_workspace_membership(user=self.user2, workspace=workspace3, is_admin=False)
        self.workspace3 = workspace3

    async def _asyncSetUp_workspace4(self):
        # workspace4, self.user2(ws-admin), empty
        workspace4 = await f.create_workspace(name="workspace4", created_by=self.user2)
        self.workspace4 = workspace4

    async def _asyncSetUp_workspace5(self):
        # workspace5, self.user1(ws-admin), self.user2(NOT ws-member)
        workspace5 = await f.create_workspace(name="workspace5", created_by=self.user1)
        # self.user2 is a pj-admin
        await f.create_project(name="pj50", workspace=workspace5, created_by=self.user2)
        # self.user2 is pj-member
        pj51 = await f.create_project(name="pj51", workspace=workspace5, created_by=self.user1)
        pj_general_role = await _get_pj_member_role(project=pj51)
        await f.create_project_membership(user=self.user2, project=pj51, role=pj_general_role)
        # self.user2 is pj-member, ws-members dont have permissions
        pj52 = await f.create_project(name="pj52", workspace=workspace5, created_by=self.user1)
        pj_general_role = await _get_pj_member_role(project=pj52)
        await f.create_project_membership(user=self.user2, project=pj52, role=pj_general_role)
        pj_general_role.permissions = []
        await _save_role(role=pj_general_role)
        # self.user2 is not a pj-member
        await f.create_project(name="pj53", workspace=workspace5, created_by=self.user1)
        self.workspace5 = workspace5

    async def _asyncSetUp_workspace6(self):
        # workspace6, self.user1(ws-admin), self.user2(NOT ws-member)
        workspace6 = await f.create_workspace(name="workspace6", created_by=self.user1)
        # self.user2 is NOT a pj-member
        await f.create_project(workspace=workspace6, created_by=self.user1)
        self.workspace6 = workspace6

    async def _asyncSetUp_workspace7(self):
        # workspace7 that shouldnt appear to anyone
        workspace7 = await f.create_workspace(name="workspace7")
        # self.user1 and self.user2 are NOT pj-member
        await f.create_project(workspace=workspace7)
        self.workspace7 = workspace7

    async def test_get_workspace1(self):
        await self._asyncSetUp_workspace1()

        ws = await repositories.get_user_workspace_overview(user=self.user1, id=self.workspace1.id)
        self.assertEqual(ws.name, self.workspace1.name)
        self.assertEqual(len(ws.latest_projects), 6)
        self.assertEqual(len(ws.invited_projects), 1)
        self.assertEqual(ws.total_projects, 7)
        self.assertTrue(ws.has_projects)
        self.assertEqual(ws.user_role, "admin")

        ws = await repositories.get_user_workspace_overview(user=self.user2, id=self.workspace1.id)
        self.assertEqual(ws.name, self.workspace1.name)
        self.assertEqual(len(ws.latest_projects), 6)
        self.assertEqual(len(ws.invited_projects), 0)
        self.assertEqual(ws.total_projects, 6)
        self.assertTrue(ws.has_projects)
        self.assertEqual(ws.user_role, "member")

        ws = await repositories.get_user_workspace_overview(user=self.user3, id=self.workspace1.id)
        self.assertEqual(ws.name, self.workspace1.name)
        self.assertEqual(len(ws.latest_projects), 0)
        self.assertEqual(len(ws.invited_projects), 3)
        self.assertEqual(ws.total_projects, 0)
        self.assertTrue(ws.has_projects)
        self.assertEqual(ws.user_role, "guest")

    async def test_get_workspace2(self):
        await self._asyncSetUp_workspace2()

        ws = await repositories.get_user_workspace_overview(user=self.user1, id=self.workspace2.id)
        self.assertEqual(ws.name, self.workspace2.name)
        self.assertEqual(len(ws.latest_projects), 1)
        self.assertEqual(len(ws.invited_projects), 0)
        self.assertEqual(ws.total_projects, 1)
        self.assertTrue(ws.has_projects)
        self.assertEqual(ws.user_role, "admin")

        ws = await repositories.get_user_workspace_overview(user=self.user2, id=self.workspace2.id)
        self.assertEqual(ws.name, self.workspace2.name)
        self.assertEqual(len(ws.latest_projects), 0)
        self.assertEqual(len(ws.invited_projects), 0)
        self.assertEqual(ws.total_projects, 0)
        self.assertTrue(ws.has_projects)
        self.assertEqual(ws.user_role, "member")

        ws = await repositories.get_user_workspace_overview(user=self.user3, id=self.workspace2.id)
        self.assertIsNone(ws)

    async def test_get_workspace3(self):
        await self._asyncSetUp_workspace3()

        ws = await repositories.get_user_workspace_overview(user=self.user1, id=self.workspace3.id)
        self.assertEqual(ws.name, self.workspace3.name)
        self.assertEqual(len(ws.latest_projects), 0)
        self.assertEqual(len(ws.invited_projects), 0)
        self.assertEqual(ws.total_projects, 0)
        self.assertFalse(ws.has_projects)
        self.assertEqual(ws.user_role, "admin")

        ws = await repositories.get_user_workspace_overview(user=self.user2, id=self.workspace3.id)
        self.assertEqual(ws.name, self.workspace3.name)
        self.assertEqual(len(ws.latest_projects), 0)
        self.assertEqual(len(ws.invited_projects), 0)
        self.assertEqual(ws.total_projects, 0)
        self.assertFalse(ws.has_projects)
        self.assertEqual(ws.user_role, "member")

        ws = await repositories.get_user_workspace_overview(user=self.user3, id=self.workspace3.id)
        self.assertIsNone(ws)

    async def test_get_workspace4(self):
        await self._asyncSetUp_workspace4()

        ws = await repositories.get_user_workspace_overview(user=self.user1, id=self.workspace4.id)
        self.assertIsNone(ws)

        ws = await repositories.get_user_workspace_overview(user=self.user2, id=self.workspace4.id)
        self.assertEqual(ws.name, self.workspace4.name)
        self.assertEqual(len(ws.latest_projects), 0)
        self.assertEqual(len(ws.invited_projects), 0)
        self.assertEqual(ws.total_projects, 0)
        self.assertFalse(ws.has_projects)
        self.assertEqual(ws.user_role, "admin")

        ws = await repositories.get_user_workspace_overview(user=self.user3, id=self.workspace4.id)
        self.assertIsNone(ws)

    async def test_get_workspace5(self):
        await self._asyncSetUp_workspace5()

        ws = await repositories.get_user_workspace_overview(user=self.user1, id=self.workspace5.id)
        self.assertEqual(ws.name, self.workspace5.name)
        self.assertEqual(len(ws.latest_projects), 4)
        self.assertEqual(len(ws.invited_projects), 0)
        self.assertEqual(ws.total_projects, 4)
        self.assertTrue(ws.has_projects)
        self.assertEqual(ws.user_role, "admin")

        ws = await repositories.get_user_workspace_overview(user=self.user2, id=self.workspace5.id)
        self.assertEqual(ws.name, self.workspace5.name)
        self.assertEqual(len(ws.latest_projects), 3)
        self.assertEqual(len(ws.invited_projects), 0)
        self.assertEqual(ws.total_projects, 3)
        self.assertTrue(ws.has_projects)
        self.assertEqual(ws.user_role, "guest")

        ws = await repositories.get_user_workspace_overview(user=self.user3, id=self.workspace5.id)
        self.assertIsNone(ws)

    async def test_get_workspace6(self):
        await self._asyncSetUp_workspace6()

        ws = await repositories.get_user_workspace_overview(user=self.user1, id=self.workspace6.id)
        self.assertEqual(ws.name, self.workspace6.name)
        self.assertEqual(len(ws.latest_projects), 1)
        self.assertEqual(len(ws.invited_projects), 0)
        self.assertEqual(ws.total_projects, 1)
        self.assertTrue(ws.has_projects)
        self.assertEqual(ws.user_role, "admin")

        ws = await repositories.get_user_workspace_overview(user=self.user2, id=self.workspace6.id)
        self.assertIsNone(ws)

        ws = await repositories.get_user_workspace_overview(user=self.user3, id=self.workspace6.id)
        self.assertIsNone(ws)

    async def test_get_workspace7(self):
        await self._asyncSetUp_workspace7()

        ws = await repositories.get_user_workspace_overview(user=self.user1, id=self.workspace7.id)
        self.assertIsNone(ws)

        ws = await repositories.get_user_workspace_overview(user=self.user2, id=self.workspace7.id)
        self.assertIsNone(ws)

        ws = await repositories.get_user_workspace_overview(user=self.user3, id=self.workspace7.id)
        self.assertIsNone(ws)
