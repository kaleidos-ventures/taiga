# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


import pytest
from taiga.workspaces import repositories
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# get_workspace_with_latest_projects
##########################################################


def test_get_workspaces_with_latest_projects_for_owner():
    user = f.UserFactory()
    f.WorkspaceFactory(owner=user)
    f.WorkspaceFactory(owner=user)

    workspaces = repositories.get_workspaces_with_latest_projects(owner=user)
    assert len(workspaces) == 2


def test_get_workspaces_with_latest_projects_return_last_6_projects_and_total_projects():
    user = f.UserFactory()
    workspace1 = f.WorkspaceFactory(owner=user)
    workspace2 = f.WorkspaceFactory(owner=user)
    for x in range(7):
        f.ProjectFactory(owner=user, workspace=workspace1)
    for y in range(3):
        f.ProjectFactory(owner=user, workspace=workspace2)

    workspaces = repositories.get_workspaces_with_latest_projects(owner=user)
    assert len(workspaces[0].latest_projects) == 3
    assert workspaces[0].total_projects == 3
    assert len(workspaces[1].latest_projects) == 6
    assert workspaces[1].total_projects == 7


def test_get_workspaces_with_latest_projects_order_by_created_date():
    user = f.UserFactory()
    workspace1 = f.WorkspaceFactory(owner=user)
    workspace2 = f.WorkspaceFactory(owner=user)
    for x in range(2):
        f.ProjectFactory(owner=user, workspace=workspace1)
    for y in range(3):
        f.ProjectFactory(owner=user, workspace=workspace2)

    workspaces = repositories.get_workspaces_with_latest_projects(owner=user)
    assert workspaces[0].created_date > workspaces[1].created_date
    assert workspaces[0].latest_projects[0].created_date > workspaces[0].latest_projects[1].created_date
    assert workspaces[1].latest_projects[0].created_date > workspaces[1].latest_projects[1].created_date


##########################################################
# create_workspace
##########################################################


def test_create_workspace_with_non_ASCI_chars():
    user = f.UserFactory()
    workspace = repositories.create_workspace(name="My w0r#%&乕شspace", color=3, owner=user)
    assert workspace.slug.startswith("my-w0rhu-shspace")


##########################################################
# get_workspace
##########################################################


def test_get_workspace_return_workspace():
    workspace = f.WorkspaceFactory(name="ws 1")
    assert repositories.get_workspace(slug=workspace.slug) == workspace


def test_get_workspace_return_none():
    f.WorkspaceFactory(name="ws 1")
    assert repositories.get_workspace(slug="ws-not-exist") is None


##########################################################
# get_user_workspaces_with_latest_projects
##########################################################


def test_get_user_workspaces_with_latest_projects():
    user6 = f.UserFactory(username="user6")
    user7 = f.UserFactory(username="user7")

    # workspace premium, user6(ws-admin), user7(ws-member)
    workspace1 = f.create_workspace(name="workspace1", owner=user6, is_premium=True)
    ws_member_role = workspace1.workspace_roles.exclude(is_admin=True).first()
    f.WorkspaceMembershipFactory.create(user=user7, workspace=workspace1, workspace_role=ws_member_role)
    # user7 is a pj-owner
    f.create_project(name="pj10", workspace=workspace1, owner=user7)
    # user7 is pj-member with access
    pj11 = f.create_project(name="pj11", workspace=workspace1, owner=user6)
    pj_general_role = pj11.roles.get(slug="general")
    f.MembershipFactory.create(user=user7, project=pj11, role=pj_general_role)
    # user7 is pj-member but its role has no-access, ws-members have permissions
    pj12 = f.create_project(name="pj12", workspace=workspace1, owner=user6)
    pj_general_role = pj12.roles.get(slug="general")
    f.MembershipFactory.create(user=user7, project=pj12, role=pj_general_role)
    pj_general_role.permissions = []
    pj_general_role.save()
    pj12.workspace_member_permissions = ["view_us"]
    pj12.save()
    # user7 is pj-member but its role has no-access, ws-members dont have permissions
    pj13 = f.create_project(name="pj13", workspace=workspace1, owner=user6)
    pj_general_role = pj13.roles.get(slug="general")
    f.MembershipFactory.create(user=user7, project=pj13, role=pj_general_role)
    pj_general_role.permissions = []
    pj_general_role.save()
    # user7 is not a pj-member but the project allows 'view_us' to ws-members
    pj14 = f.create_project(name="pj14", workspace=workspace1, owner=user6)
    pj14.workspace_member_permissions = ["view_us"]
    pj14.save()
    # user7 is not a pj-member and ws-members are not allowed
    f.create_project(name="pj15", workspace=workspace1, owner=user6)

    # workspace premium, user6(ws-admin), user7(ws-member, has_projects: true)
    workspace2 = f.create_workspace(name="workspace2", owner=user6, is_premium=True)
    ws_member_role = workspace2.workspace_roles.exclude(is_admin=True).first()
    f.WorkspaceMembershipFactory.create(user=user7, workspace=workspace2, workspace_role=ws_member_role)
    # user7 is not a pj-member and ws-members are not allowed
    f.create_project(workspace=workspace2, owner=user6)

    # workspace premium, user6(ws-admin), user7(ws-member, has_projects: false)
    workspace3 = f.create_workspace(name="workspace3", owner=user6, is_premium=True)
    ws_member_role = workspace3.workspace_roles.exclude(is_admin=True).first()
    f.WorkspaceMembershipFactory.create(user=user7, workspace=workspace3, workspace_role=ws_member_role)

    # workspace no premium, user7(ws-admin), empty
    workspace4 = f.create_workspace(name="workspace4", owner=user7, is_premium=False)

    # workspace premium, user6(ws-admin), user7(NOT ws-member)
    workspace5 = f.create_workspace(name="workspace5", owner=user6, is_premium=True)
    # user7 is a pj-owner
    f.create_project(name="pj50", workspace=workspace5, owner=user7)
    # user7 is pj-member with access
    pj51 = f.create_project(name="pj51", workspace=workspace5, owner=user6)
    pj_general_role = pj51.roles.get(slug="general")
    f.MembershipFactory.create(user=user7, project=pj51, role=pj_general_role)
    # user7 is pj-member but its role has no-access, ws-members dont have permissions
    pj52 = f.create_project(name="pj52", workspace=workspace5, owner=user6)
    pj_general_role = pj52.roles.get(slug="general")
    f.MembershipFactory.create(user=user7, project=pj52, role=pj_general_role)
    pj_general_role.permissions = []
    pj_general_role.save()
    # user7 is not a pj-member
    f.create_project(name="pj53", workspace=workspace5, owner=user6)

    # workspace premium, user6(ws-admin), user7(NOT ws-member)
    workspace6 = f.create_workspace(name="workspace6", owner=user6, is_premium=True)
    # user7 is NOT a pj-member
    f.create_project(workspace=workspace6, owner=user6)

    # workspace that shouldnt appear to anyone
    workspace7 = f.create_workspace(name="workspace7", is_premium=True)
    # user6 and user7 are NOT pj-member
    f.create_project(workspace=workspace7)

    res = repositories.get_user_workspaces_with_latest_projects(user6)

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

    res = repositories.get_user_workspaces_with_latest_projects(user7)

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
