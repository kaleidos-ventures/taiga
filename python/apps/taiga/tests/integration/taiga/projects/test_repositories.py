# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from django.core.files import File
from taiga.permissions import choices
from taiga.projects import repositories
from tests.utils import factories as f
from tests.utils.images import valid_image_f

pytestmark = pytest.mark.django_db


##########################################################
# create_project
##########################################################


def test_create_project_with_non_ASCI_chars():
    user = f.UserFactory()
    workspace = f.WorkspaceFactory(owner=user)
    project = repositories.create_project(
        name="My proj#%&乕شect", description="", color=3, owner=user, workspace=workspace
    )
    assert project.slug.startswith("my-projhu-shect")


def test_create_project_with_logo():
    user = f.UserFactory()
    workspace = f.WorkspaceFactory(owner=user)
    project = repositories.create_project(
        name="My proj#%&乕شect", description="", color=3, owner=user, workspace=workspace, logo=valid_image_f
    )
    assert valid_image_f.name in project.logo.name


def test_create_project_with_no_logo():
    user = f.UserFactory()
    workspace = f.WorkspaceFactory(owner=user)
    project = repositories.create_project(
        name="My proj#%&乕شect", description="", color=3, owner=user, workspace=workspace, logo=None
    )
    assert project.logo == File(None)


##########################################################
# get_project
##########################################################


def test_get_project_return_project():
    project = f.ProjectFactory(name="Project 1")
    assert repositories.get_project(slug=project.slug) == project


def test_get_project_return_none():
    assert repositories.get_project(slug="project-not-exist") is None


##########################################################
# get_template
##########################################################


def test_get_template_return_template():
    template = f.ProjectTemplateFactory()
    assert repositories.get_template(slug=template.slug) == template


##########################################################
# create_membership
##########################################################


def test_create_membership():
    user = f.UserFactory()
    workspace = f.WorkspaceFactory(owner=user)
    project = f.ProjectFactory(owner=user, workspace=workspace)
    role = f.RoleFactory(project=project)
    membership = repositories.create_membership(user=user, project=project, role=role, email=user.email)
    assert membership in project.memberships.all()


##########################################################
# get_project_role
##########################################################


def test_get_project_role_return_role():
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.ProjectFactory(owner=user, workspace=workspace)
    role = f.RoleFactory(
        name="Role test", slug="role-test", permissions=choices.ADMINS_PERMISSIONS_LIST, is_admin=True, project=project
    )
    assert repositories.get_project_role(project=project, slug="role-test") == role


def test_get_project_role_return_none():
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.create_project(owner=user, workspace=workspace)
    assert repositories.get_project_role(project=project, slug="role-not-exist") is None


##########################################################
# get_project_roles
##########################################################


def test_get_project_roles_return_roles():
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.ProjectFactory(owner=user, workspace=workspace)
    role1 = f.RoleFactory(
        name="Role test1",
        slug="role-test1",
        permissions=choices.ADMINS_PERMISSIONS_LIST,
        is_admin=True,
        project=project,
    )
    role2 = f.RoleFactory(
        name="Role test2",
        slug="role-test2",
        permissions=choices.MEMBERS_PERMISSIONS_LIST,
        is_admin=False,
        project=project,
    )
    assert len(repositories.get_project_roles(project=project)) == 2
    assert repositories.get_project_roles(project=project)[0] == role1
    assert repositories.get_project_roles(project=project)[1] == role2


def test_get_project_roles_no_roles():
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.ProjectFactory(owner=user, workspace=workspace)
    assert len(repositories.get_project_roles(project=project)) == 0


##########################################################
# get_first_role
##########################################################


def test_get_first_role_return_role():
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.ProjectFactory(owner=user, workspace=workspace)
    role1 = f.RoleFactory(
        name="Role test1",
        slug="role-test1",
        permissions=choices.ADMINS_PERMISSIONS_LIST,
        is_admin=True,
        project=project,
    )
    f.RoleFactory(
        name="Role test2",
        slug="role-test2",
        permissions=choices.MEMBERS_PERMISSIONS_LIST,
        is_admin=False,
        project=project,
    )
    assert repositories.get_first_role(project=project) == role1


def test_get_first_role_no_roles():
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.ProjectFactory(owner=user, workspace=workspace)
    assert repositories.get_first_role(project=project) is None


##########################################################
# get_num_members_by_role_id
##########################################################


def test_get_num_members_by_role_id():
    user = f.UserFactory()
    user2 = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.ProjectFactory(owner=user, workspace=workspace)
    role = f.RoleFactory(
        name="Role test", slug="role-test", permissions=choices.ADMINS_PERMISSIONS_LIST, is_admin=True, project=project
    )
    f.MembershipFactory(user=user, project=project, role=role)
    f.MembershipFactory(user=user2, project=project, role=role)

    assert repositories.get_num_members_by_role_id(role_id=role.id) == 2


def test_get_num_members_by_role_id_no_members():
    user = f.UserFactory()
    workspace = f.create_workspace(owner=user)
    project = f.ProjectFactory(owner=user, workspace=workspace)
    role = f.RoleFactory(
        name="Role test", slug="role-test", permissions=choices.ADMINS_PERMISSIONS_LIST, is_admin=True, project=project
    )

    assert repositories.get_num_members_by_role_id(role_id=role.id) == 0


##########################################################
# update roles permissions
##########################################################


def test_update_role_permissions():
    role = f.RoleFactory()
    role = repositories.update_role_permissions(role, ["new_permission"])
    assert "new_permission" in role.permissions
