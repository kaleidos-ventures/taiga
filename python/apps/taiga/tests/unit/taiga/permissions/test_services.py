# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from taiga.base.api.permissions import check_permissions
from taiga.exceptions import api as ex
from taiga.permissions import HasPerm, choices, services
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


def test_is_project_admin_being_project_admin():
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.create_project(owner=user, workspace=workspace)

    assert services.is_project_admin(user=user, obj=project) is True


def test_is_project_admin_being_project_member():
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.ProjectFactory(owner=user, workspace=workspace)

    user2 = f.UserFactory()
    general_member_role = f.RoleFactory(
        name="General Members",
        slug="general-members",
        permissions=choices.MEMBERS_PERMISSIONS_LIST,
        is_admin=False,
        project=project,
    )
    f.MembershipFactory(user=user2, project=project, role=general_member_role)

    assert services.is_project_admin(user=user2, obj=project) is False


def test_is_project_admin_without_project():
    user = f.UserFactory()
    f.create_workspace(owner=user)

    assert services.is_project_admin(user=user, obj=None) is False


def test_is_workspace_admin_being_workspace_admin():
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)

    assert services.is_workspace_admin(user=user, obj=workspace) is True


def test_is_workspace_admin_being_workspace_member():
    user = f.UserFactory()
    workspace = f.WorkspaceFactory(owner=user)

    user2 = f.UserFactory()
    general_member_role = f.WorkspaceRoleFactory(
        name="General Members",
        slug="general-members",
        permissions=choices.WORKSPACE_MEMBERS_PERMISSIONS_LIST,
        is_admin=False,
        workspace=workspace,
    )
    f.WorkspaceMembershipFactory(user=user2, workspace=workspace, workspace_role=general_member_role)

    assert services.is_workspace_admin(user=user2, obj=workspace) is False


def test_is_workspace_admin_without_workspace():
    user = f.UserFactory()
    f.create_workspace(owner=user)

    assert services.is_workspace_admin(user=user, obj=None) is False


def test_user_has_perm_being_project_admin():
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.create_project(owner=user, workspace=workspace)
    perm = "modify_project"

    assert services.user_has_perm(user=user, perm=perm, obj=project) is True


def test_user_has_perm_being_project_member():
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.ProjectFactory(owner=user, workspace=workspace)
    general_member_role = f.RoleFactory(
        name="General Members",
        slug="general-members",
        permissions=choices.MEMBERS_PERMISSIONS_LIST,
        is_admin=False,
        project=project,
    )

    user2 = f.UserFactory()
    f.MembershipFactory(user=user2, project=project, role=general_member_role)

    perm = "modify_project"
    assert services.user_has_perm(user=user2, perm=perm, obj=project) is False

    perm = "view_project"
    assert services.user_has_perm(user=user2, perm=perm, obj=project) is True


def test_user_has_perm_not_being_project_member():
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.create_project(owner=user, workspace=workspace)

    user2 = f.UserFactory()
    perm = "modify_project"

    assert services.user_has_perm(user=user2, perm=perm, obj=project) is False


def test_user_has_perm_without_workspace_and_project():
    user = f.UserFactory()
    perm = "modify_project"

    assert services.user_has_perm(user=user, perm=perm, obj=None) is False


def test_user_has_perm_without_perm():
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.create_project(owner=user, workspace=workspace)

    assert services.user_has_perm(user=user, perm=None, obj=project) is False


def test_check_permissions_success():
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.create_project(owner=user, workspace=workspace)

    permissions = HasPerm("modify_project")

    assert check_permissions(permissions=permissions, user=user, obj=project) is None


def test_check_permissions_forbidden():
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.create_project(owner=user, workspace=workspace)

    user2 = f.UserFactory()
    permissions = HasPerm("modify_project")

    with pytest.raises(ex.ForbiddenError) as error:
        check_permissions(permissions=permissions, user=user2, obj=project)

    assert error.value.status_code == 403
    assert error.value.detail == "Forbidden"
