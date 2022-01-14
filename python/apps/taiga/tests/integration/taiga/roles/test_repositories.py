# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from taiga.permissions import choices
from taiga.roles import repositories
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# get_project_role
##########################################################


def test_get_project_role_return_role():
    project = f.ProjectFactory()
    role = f.RoleFactory(
        name="Role test",
        slug="role-test",
        permissions=choices.PROJECT_ADMIN_PERMISSIONS,
        is_admin=True,
        project=project,
    )
    assert repositories.get_project_role(project=project, slug="role-test") == role


def test_get_project_role_return_none():
    project = f.create_project()
    assert repositories.get_project_role(project=project, slug="role-not-exist") is None


##########################################################
# get_project_roles
##########################################################


def test_get_project_roles_return_roles():
    project = f.ProjectFactory()
    role1 = f.RoleFactory(
        name="Role test1",
        slug="role-test1",
        permissions=choices.PROJECT_ADMIN_PERMISSIONS,
        is_admin=True,
        project=project,
    )
    role2 = f.RoleFactory(
        name="Role test2",
        slug="role-test2",
        permissions=choices.PROJECT_PERMISSIONS,
        is_admin=False,
        project=project,
    )
    assert len(repositories.get_project_roles(project=project)) == 2
    assert repositories.get_project_roles(project=project)[0] == role1
    assert repositories.get_project_roles(project=project)[1] == role2


def test_get_project_roles_no_roles():
    project = f.ProjectFactory()
    assert len(repositories.get_project_roles(project=project)) == 0


##########################################################
# get_first_role
##########################################################


def test_get_first_role_return_role():
    project = f.ProjectFactory()
    role1 = f.RoleFactory(
        name="Role test1",
        slug="role-test1",
        permissions=choices.PROJECT_ADMIN_PERMISSIONS,
        is_admin=True,
        project=project,
    )
    f.RoleFactory(
        name="Role test2",
        slug="role-test2",
        permissions=choices.PROJECT_PERMISSIONS,
        is_admin=False,
        project=project,
    )
    assert repositories.get_first_role(project=project) == role1


def test_get_first_role_no_roles():
    project = f.ProjectFactory()
    assert repositories.get_first_role(project=project) is None


##########################################################
# get_num_members_by_role_id
##########################################################


def test_get_num_members_by_role_id():
    project = f.ProjectFactory()
    user = f.UserFactory()
    user2 = f.UserFactory()

    role = f.RoleFactory(
        name="Role test",
        slug="role-test",
        permissions=choices.PROJECT_PERMISSIONS,
        is_admin=True,
        project=project,
    )
    f.MembershipFactory(user=user, project=project, role=role)
    f.MembershipFactory(user=user2, project=project, role=role)

    assert repositories.get_num_members_by_role_id(role_id=role.id) == 2


def test_get_num_members_by_role_id_no_members():
    project = f.ProjectFactory()
    role = f.RoleFactory(
        name="Role test",
        slug="role-test",
        permissions=choices.PROJECT_ADMIN_PERMISSIONS,
        is_admin=True,
        project=project,
    )

    assert repositories.get_num_members_by_role_id(role_id=role.id) == 0


##########################################################
# update roles permissions
##########################################################


def test_update_role_permissions():
    role = f.RoleFactory()
    role = repositories.update_role_permissions(role, ["new_permission"])
    assert "new_permission" in role.permissions


##########################################################
# create_membership
##########################################################


def test_create_membership():
    project = f.ProjectFactory()
    role = f.RoleFactory(project=project)
    membership = repositories.create_membership(user=project.owner, project=project, role=role, email=None)
    assert membership in project.memberships.all()
