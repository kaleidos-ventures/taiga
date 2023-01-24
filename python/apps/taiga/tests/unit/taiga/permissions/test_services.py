# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

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
    user = await f.create_user()
    project = await f.create_project(owner=user)
    is_admin = await services.is_project_admin(user=user, obj=project)
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
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)
    assert await services.is_workspace_admin(user=user, obj=workspace) is True


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
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)
    perms = choices.WorkspacePermissions.values

    with (
        patch("taiga.permissions.services.get_user_permissions_for_workspace", return_value=perms),
        patch("taiga.permissions.services.get_user_permissions_for_project"),
    ):
        assert await services.get_user_permissions(user=user, obj=workspace) == perms
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
    user = await f.create_user()
    project = await f.create_project(owner=user)
    perm = []

    with patch("taiga.permissions.services.get_user_permissions", return_value=[]):
        assert await services.user_has_perm(user=user, perm=perm, obj=project) is False
        services.get_user_permissions.assert_awaited_once_with(user=user, obj=project)


async def test_user_has_perm_with_project_ok():
    user = await f.create_user()
    project = await f.create_project(owner=user)
    perm = "view_story"

    with patch("taiga.permissions.services.get_user_permissions", return_value=[perm]):
        assert await services.user_has_perm(user=user, perm=perm, obj=project) is True
        services.get_user_permissions.assert_awaited_once_with(user=user, obj=project)


async def test_user_has_perm_with_workspace_ok():
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)
    perm = "view_story"

    with patch("taiga.permissions.services.get_user_permissions", return_value=[perm]):
        assert await services.user_has_perm(user=user, perm=perm, obj=workspace) is True
        services.get_user_permissions.assert_awaited_once_with(user=user, obj=workspace)


#####################################################
# user_can_view_project
#####################################################


async def test_user_can_view_project_ok():
    user = await f.create_user()
    project = await f.create_project(owner=user)
    perms = ["view_story"]

    with patch("taiga.permissions.services.get_user_permissions", return_value=perms):
        assert await services.user_can_view_project(user=user, obj=project) is True
        services.get_user_permissions.assert_awaited_once_with(user=user, obj=project)


async def test_user_can_view_project_without_project():
    user = await f.create_user()
    no_perms = []

    with patch("taiga.permissions.services.get_user_permissions", return_value=no_perms):
        assert await services.user_can_view_project(user=user, obj=None) is False
        services.get_user_permissions.assert_awaited_once_with(user=user, obj=None)


async def test_user_can_view_project_being_a_team_member():
    user = await f.create_user()
    project = await f.create_project(owner=user)
    perms = choices.EditStoryPermissions.values

    with patch("taiga.permissions.services.get_user_permissions", return_value=perms):
        assert await services.user_can_view_project(user=user, obj=project) is True
        services.get_user_permissions.assert_awaited_once_with(user=user, obj=project)


#####################################################
# get_user_project_role_info
#####################################################


async def get_user_project_role_info():
    user = await f.create_user()
    project = await f.create_project(owner=user)
    with patch("taiga.permissions.services.pj_roles_repositories", autospec=True) as fake_repository:
        await get_user_project_role_info(user=user, project=project)
        fake_repository.get_project_role.assert_awaited_once()


#####################################################
# get_user_workspace_role_info
#####################################################


async def get_user_workspace_role_info():
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)
    with patch("taiga.permissions.services.ws_roles_repositories", autospec=True) as fake_repository:
        await get_user_workspace_role_info(user=user, workspace=workspace)
        fake_repository.get_workspace_role_for_user.assert_awaited_once()


#####################################################
# get_user_permissions_for_project
#####################################################


async def test_get_user_permissions_for_project():
    project = await f.create_project()

    params = [True, False, False, False, False, [], project]
    assert await services.get_user_permissions_for_project(*params) == choices.ProjectPermissions.values

    params = [False, True, False, False, False, [], project]
    assert await services.get_user_permissions_for_project(*params) == choices.ProjectPermissions.values

    params = [False, False, True, False, True, ["view_story", "view_project"], project]
    # a project member will always view the project she's member of, no matter her role's permissions
    res = await services.get_user_permissions_for_project(*params)
    assert "view_story" in res
    assert "view_project" in res
    assert len(res) == 2

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
    old_permissions = ["view_project"]
    new_permissions = ["view_story"]

    assert await services.is_view_story_permission_deleted(old_permissions, new_permissions) is False


async def test_is_view_story_permission_deleted_true():
    old_permissions = ["view_story"]
    new_permissions = ["view_project"]

    assert await services.is_view_story_permission_deleted(old_permissions, new_permissions) is True
