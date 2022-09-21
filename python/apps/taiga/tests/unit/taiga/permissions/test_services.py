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
# user_has_perm
#####################################################


async def test_user_has_perm_without_perm():
    user = await f.create_user()
    project = await f.create_project(owner=user)

    assert await services.user_has_perm(user=user, perm=None, obj=project) is False


async def test_user_has_perm_being_project_admin():
    user = await f.create_user()
    project = await f.create_project(owner=user)
    perm = "view_story"

    assert await services.user_has_perm(user=user, perm=perm, obj=project) is True


async def test_user_has_perm_being_project_member():
    project = await f.create_project()
    general_member_role = await f.create_project_role(
        project=project,
        permissions=choices.ProjectPermissions.values,
        is_admin=False,
    )
    user = await f.create_user()
    view_perm = "view_story"
    await f.create_project_membership(user=user, project=project, role=general_member_role)

    assert await services.user_has_perm(user=user, perm=view_perm, obj=project) is True


async def test_user_has_perm_not_being_project_member():
    project = await f.create_project()
    user = await f.create_user()
    perm = "view_story"

    assert await services.user_has_perm(user=user, perm=perm, obj=project) is False


async def test_user_has_perm_without_workspace_and_project():
    user = await f.create_user()
    perm = "view_story"

    assert await services.user_has_perm(user=user, perm=perm, obj=None) is False


#####################################################
# user_can_view_project
#####################################################


async def test_user_can_view_project_without_project():
    user = await f.create_user()
    project = await f.create_project()
    with patch.object(services, "_get_object_project", return_value=None):
        # no project to verify permissions with (permission denied)
        assert await services.user_can_view_project(user=user, obj=project) is False


async def test_user_can_view_project_being_a_team_member():
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)
    project = await f.create_project(workspace=workspace, owner=user)

    # the user is a project member (permission granted)
    assert await services.user_can_view_project(user=user, obj=project) is True


#####################################################
# get_user_project_role_info
#####################################################


async def get_user_project_role_info():
    user = await f.create_user()
    project = await f.create_project(owner=user)
    with patch("taiga.permissions.services.roles_repositories", autospec=True) as fake_repository:
        await get_user_project_role_info(user=user, project=project)
        fake_repository.get_role_for_user.assert_awaited_once()


#####################################################
# get_user_workspace_role_info
#####################################################


async def get_user_workspace_role_info():
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)
    with patch("taiga.permissions.services.roles_repositories", autospec=True) as fake_repository:
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

    params = [False, False, True, False, False, ["view_story"], project]
    assert await services.get_user_permissions_for_project(*params) == ["view_story"]

    params = [False, False, False, True, False, [], project]
    assert await services.get_user_permissions_for_project(*params) == project.workspace_member_permissions

    params = [False, False, False, False, True, [], project]
    assert await services.get_user_permissions_for_project(*params) == project.public_permissions

    params = [False, False, False, False, False, [], project]
    assert await services.get_user_permissions_for_project(*params) == project.anon_permissions


#####################################################
# permissions_are_valid
#####################################################


@pytest.mark.parametrize(
    "permissions, expected",
    [
        (["comment_story", "view_story"], True),
        (["comment_story", "not_valid"], False),
        (["non_existent"], False),
        (["view_story", "comment_story", "view_task"], True),
        (["view_story", "foo"], False),
        (["view_story", "view_task"], True),
    ],
)
def test_permissions_are_valid(permissions, expected):
    assert services.permissions_are_valid(permissions) == expected


#####################################################
# permissions_are_compatible
#####################################################


@pytest.mark.parametrize(
    "permissions, expected",
    [
        (["add_story", "modify_story", "comment_story"], False),
        (["comment_story", "view_story"], True),
        (["comment_task", "view_story"], False),
        (["modify_task", "comment_story"], False),
        (["view_story", "comment_story", "view_story"], True),
        (["view_story", "modify_story", "comment_story"], True),
        (["view_story", "view_story"], True),
        (["view_story"], True),
        (["view_task", "comment_story"], False),
    ],
)
def test_permissions_are_compatible(permissions, expected):
    assert services.permissions_are_compatible(permissions) == expected
