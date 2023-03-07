# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from unittest.mock import patch

import pytest
from taiga.permissions import choices, services
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


#####################################################
# is_project_admin
#####################################################


async def test_is_project_admin_without_project():
    user = await f.create_user()
    is_admin = await services.is_project_admin(user=user, obj=None)
    assert is_admin is False


async def test_is_project_admin_being_project_admin():
    project = await f.create_project()
    is_admin = await services.is_project_admin(user=project.created_by, obj=project)
    assert is_admin is True


async def test_is_project_admin_being_project_member():
    project = await f.create_project()

    user2 = await f.create_user()
    general_member_role = await f.create_project_role(
        project=project,
        is_admin=False,
    )
    await f.create_project_membership(user=user2, project=project, role=general_member_role)

    assert await services.is_project_admin(user=user2, obj=project) is False


#####################################################
# is_workspace_admin
#####################################################


async def test_is_workspace_admin_without_workspace():
    user = await f.create_user()
    assert await services.is_workspace_admin(user=user, obj=None) is False


async def test_is_workspace_admin_being_workspace_admin():
    workspace = await f.create_workspace()
    assert await services.is_workspace_admin(user=workspace.created_by, obj=workspace) is True


async def test_is_workspace_admin_being_workspace_member():
    workspace = await f.create_workspace()

    user2 = await f.create_user()
    general_member_role = await f.create_workspace_role(
        workspace=workspace,
        is_admin=False,
    )
    await f.create_workspace_membership(user=user2, workspace=workspace, role=general_member_role)

    assert await services.is_workspace_admin(user=user2, obj=workspace) is False


#####################################################
# is_project_member
#####################################################


async def test_is_project_member_not_being_project_member():
    user = await f.create_user()
    project = await f.create_project()
    is_member = await services.is_project_member(user=user, project=project)
    assert is_member is False


async def test_is_project_member_being_project_member():
    project = await f.create_project()
    is_member = await services.is_project_member(user=project.created_by, project=project)
    assert is_member is True


#####################################################
# get_user_permissions
#####################################################


async def test_get_user_permissions_without_object():
    user = await f.create_user()

    assert await services.get_user_permissions(user=user, obj=None) == []


async def test_get_user_permissions_with_project():
    user = await f.create_user()
    project = await f.create_project()
    perms = choices.ProjectPermissions.values

    with (
        patch("taiga.permissions.services.get_user_permissions_for_project", return_value=perms),
        patch("taiga.permissions.services.get_user_permissions_for_workspace"),
    ):
        assert await services.get_user_permissions(user=user, obj=project) == perms
        services.get_user_permissions_for_project.assert_awaited()
        services.get_user_permissions_for_workspace.assert_not_awaited()


async def test_get_user_permissions_with_workspace():
    workspace = await f.create_workspace()
    perms = choices.WorkspacePermissions.values

    with (
        patch("taiga.permissions.services.get_user_permissions_for_workspace", return_value=perms),
        patch("taiga.permissions.services.get_user_permissions_for_project"),
    ):
        assert await services.get_user_permissions(user=workspace.created_by, obj=workspace) == perms
        services.get_user_permissions_for_workspace.assert_awaited()
        services.get_user_permissions_for_project.assert_not_awaited()


#####################################################
# user_has_perm
#####################################################


async def test_user_has_perm_without_workspace_and_project():
    user = await f.create_user()
    perm = "view_story"

    with patch("taiga.permissions.services.get_user_permissions", return_value=[]):
        assert await services.user_has_perm(user=user, perm=perm, obj=None) is False
        services.get_user_permissions.assert_awaited_once_with(user=user, obj=None)


async def test_user_has_perm_without_perm():
    project = await f.create_project()
    perm = []

    with patch("taiga.permissions.services.get_user_permissions", return_value=[]):
        assert await services.user_has_perm(user=project.created_by, perm=perm, obj=project) is False
        services.get_user_permissions.assert_awaited_once_with(user=project.created_by, obj=project)


async def test_user_has_perm_with_project_ok():
    project = await f.create_project()
    perm = "view_story"

    with patch("taiga.permissions.services.get_user_permissions", return_value=[perm]):
        assert await services.user_has_perm(user=project.created_by, perm=perm, obj=project) is True
        services.get_user_permissions.assert_awaited_once_with(user=project.created_by, obj=project)


async def test_user_has_perm_with_workspace_ok():
    workspace = await f.create_workspace()
    perm = "view_story"

    with patch("taiga.permissions.services.get_user_permissions", return_value=[perm]):
        assert await services.user_has_perm(user=workspace.created_by, perm=perm, obj=workspace) is True
        services.get_user_permissions.assert_awaited_once_with(user=workspace.created_by, obj=workspace)


#####################################################
# user_can_view_project
#####################################################


async def test_user_can_view_project_without_project():
    user = await f.create_user()

    with patch("taiga.permissions.services.get_user_permissions"):
        assert await services.user_can_view_project(user=user, obj=None) is False
        services.get_user_permissions.assert_not_awaited()


async def test_user_can_view_project_being_a_workspace_admin():
    workspace = await f.create_workspace()
    project = await f.create_project(workspace=workspace)

    with (
        patch("taiga.permissions.services.is_workspace_admin", return_value=True),
        patch("taiga.permissions.services.get_user_permissions"),
    ):
        assert await services.user_can_view_project(user=workspace.created_by, obj=project) is True
        services.is_workspace_admin.assert_awaited_once_with(user=workspace.created_by, obj=workspace)
        services.get_user_permissions.assert_not_awaited()


async def test_user_can_view_project_being_a_project_member():
    user = await f.create_user()
    project = await f.create_project()
    general_member_role = await f.create_project_role(
        project=project,
        is_admin=False,
    )
    await f.create_project_membership(user=user, project=project, role=general_member_role)

    with (
        patch("taiga.permissions.services.is_project_member", return_value=True),
        patch("taiga.permissions.services.get_user_permissions"),
    ):
        assert await services.user_can_view_project(user=user, obj=project) is True
        services.is_project_member.assert_awaited_once_with(user=user, project=project)
        services.get_user_permissions.assert_not_awaited()


async def test_user_can_view_project_having_a_pending_invitation():
    user = await f.create_user()
    project = await f.create_project()
    general_member_role = await f.create_project_role(
        project=project,
        is_admin=False,
    )
    await f.create_project_invitation(user=user, project=project, role=general_member_role)

    with (
        patch("taiga.permissions.services.has_pending_project_invitation", return_value=True),
        patch("taiga.permissions.services.get_user_permissions"),
    ):
        assert await services.user_can_view_project(user=user, obj=project) is True
        services.has_pending_project_invitation.assert_awaited_once_with(user=user, project=project)
        services.get_user_permissions.assert_not_awaited()


async def test_user_can_view_project_being_a_workspace_member():
    user = await f.create_user()
    workspace = await f.create_workspace()
    general_member_role = await f.create_workspace_role(
        workspace=workspace,
        is_admin=False,
    )
    await f.create_workspace_membership(user=user, workspace=workspace, role=general_member_role)
    project = await f.create_project(workspace=workspace)
    perms = choices.WorkspacePermissions.values

    with patch("taiga.permissions.services.get_user_permissions", return_value=perms):
        assert await services.user_can_view_project(user=user, obj=project) is True
        services.get_user_permissions.assert_awaited_once_with(user=user, obj=project)


async def test_user_can_view_project_being_other_user_with_permission():
    user = await f.create_user()
    project = await f.create_project()
    perms = ["view_story"]

    with patch("taiga.permissions.services.get_user_permissions", return_value=perms):
        assert await services.user_can_view_project(user=user, obj=project) is True
        services.get_user_permissions.assert_awaited_once_with(user=user, obj=project)


async def test_user_can_view_project_being_other_user_without_permission():
    user = await f.create_user()
    project = await f.create_project()
    perms = []

    with patch("taiga.permissions.services.get_user_permissions", return_value=perms):
        assert await services.user_can_view_project(user=user, obj=project) is False
        services.get_user_permissions.assert_awaited_once_with(user=user, obj=project)


#####################################################
# get_user_project_role_info
#####################################################


async def get_user_project_role_info():
    project = await f.create_project()
    with patch("taiga.permissions.services.pj_roles_repositories", autospec=True) as fake_repository:
        await get_user_project_role_info(user=project.created_by, project=project)
        fake_repository.get_project_role.assert_awaited_once()


#####################################################
# get_user_workspace_role_info
#####################################################


async def get_user_workspace_role_info():
    workspace = await f.create_workspace()
    with patch("taiga.permissions.services.ws_roles_repositories", autospec=True) as fake_repository:
        await get_user_workspace_role_info(user=workspace.created_by, workspace=workspace)
        fake_repository.get_workspace_role_for_user.assert_awaited_once()


#######################################################
# has_pending_project_invitation
#######################################################


async def test_has_pending_project_invitation() -> None:
    user = f.build_user()
    project = f.build_project()

    with (patch("taiga.permissions.services.pj_invitations_repositories", autospec=True)) as fake_pj_invitations_repo:
        invitation = f.build_project_invitation(email=user.email, user=user, project=project)
        fake_pj_invitations_repo.get_project_invitation.return_value = invitation
        res = await services.has_pending_project_invitation(project=project, user=user)
        assert res is True

        fake_pj_invitations_repo.get_project_invitation.return_value = None
        res = await services.has_pending_project_invitation(project=project, user=user)
        assert res is False


#####################################################
# get_user_permissions_for_project
#####################################################


async def test_get_user_permissions_for_project():
    project = await f.create_project()

    params = [True, False, False, False, False, [], project]
    assert await services.get_user_permissions_for_project(*params) == choices.ProjectPermissions.values

    params = [False, True, False, False, False, [], project]
    assert await services.get_user_permissions_for_project(*params) == choices.ProjectPermissions.values

    params = [False, False, True, False, True, ["view_story"], project]
    res = await services.get_user_permissions_for_project(*params)
    assert "view_story" in res
    assert len(res) == 1

    params = [False, False, False, True, False, [], project]
    assert await services.get_user_permissions_for_project(*params) == project.workspace_member_permissions

    params = [False, False, False, False, True, [], project]
    assert await services.get_user_permissions_for_project(*params) == project.public_permissions

    params = [False, False, False, False, False, [], project]
    assert await services.get_user_permissions_for_project(*params) == project.anon_permissions


#####################################################
# get_user_permissions_for_workspace
#####################################################


async def test_get_user_permissions_for_workspace():
    workspace_role_permissions = choices.WorkspacePermissions.values
    assert await services.get_user_permissions_for_workspace(workspace_role_permissions) == workspace_role_permissions


#####################################################
# is_view_story_permission_deleted
#####################################################


async def test_is_view_story_permission_deleted_false():
    old_permissions = []
    new_permissions = ["view_story"]

    assert await services.is_view_story_permission_deleted(old_permissions, new_permissions) is False


async def test_is_view_story_permission_deleted_true():
    old_permissions = ["view_story"]
    new_permissions = []

    assert await services.is_view_story_permission_deleted(old_permissions, new_permissions) is True
