# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from django.core.files import File
from taiga.projects import repositories
from tests.utils import factories as f
from tests.utils.images import valid_image_f

pytestmark = pytest.mark.django_db


##########################################################
# create_project
##########################################################


def test_create_project_with_non_ASCI_chars():
    workspace = f.WorkspaceFactory()
    project = repositories.create_project(
        name="My proj#%&乕شect", description="", color=3, owner=workspace.owner, workspace=workspace
    )
    assert project.slug.startswith("my-projhu-shect")


def test_create_project_with_logo():
    workspace = f.WorkspaceFactory()
    project = repositories.create_project(
        name="My proj#%&乕شect", description="", color=3, owner=workspace.owner, workspace=workspace, logo=valid_image_f
    )
    assert valid_image_f.name in project.logo.name


def test_create_project_with_no_logo():
    workspace = f.WorkspaceFactory()
    project = repositories.create_project(
        name="My proj#%&乕شect", description="", color=3, owner=workspace.owner, workspace=workspace, logo=None
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
# update_project_public_permissions
##########################################################


def test_update_project_public_permissions():
    project = f.ProjectFactory(name="Project 1")
    permissions = ["view_project", "add_milestone", "view_milestones", "add_us", "view_us"]
    anon_permissions = ["view_project", "view_milestones", "view_us"]
    repositories.update_project_public_permissions(project, permissions, anon_permissions)

    assert len(project.public_permissions) == 5
    assert len(project.anon_permissions) == 3


##########################################################
# update_workspace_member_permissions
##########################################################


def test_update_project_workspace_member_permissions():
    project = f.ProjectFactory(name="Project 1")
    permissions = ["view_project", "add_milestone", "view_milestones", "add_us", "view_us"]
    repositories.update_project_workspace_member_permissions(project, permissions)

    assert len(project.workspace_member_permissions) == 5


##########################################################
# get_workspace_projects_for_user
##########################################################


def test_get_workspace_projects_for_user():
    user6 = f.UserFactory(username="user6")
    user7 = f.UserFactory(username="user7")

    # workspace premium, user6(ws-admin), user7(ws-member)
    workspace1 = f.create_workspace(owner=user6, is_premium=True)
    ws_member_role = workspace1.workspace_roles.exclude(is_admin=True).first()
    f.WorkspaceMembershipFactory.create(user=user7, workspace=workspace1, workspace_role=ws_member_role)
    # user7 is pj-member
    pj11 = f.create_project(workspace=workspace1, owner=user6)
    pj_general_role = pj11.roles.get(slug="general")
    f.MembershipFactory.create(user=user7, project=pj11, role=pj_general_role)
    # user7 is not a pj-member but the project allows 'view_us' to ws-members
    pj12 = f.create_project(workspace=workspace1, owner=user6)
    pj12.workspace_member_permissions = ["view_us"]
    pj12.save()
    # user7 is not a pj-member and ws-members are not allowed
    f.create_project(workspace=workspace1, owner=user6)
    # user7 is pj-member but its role has no-access
    pj14 = f.create_project(workspace=workspace1, owner=user6)
    pj_general_role = pj14.roles.get(slug="general")
    f.MembershipFactory.create(user=user7, project=pj14, role=pj_general_role)
    pj_general_role.permissions = []
    pj_general_role.save()
    # user7 is a pj-owner
    f.create_project(workspace=workspace1, owner=user7)

    # workspace premium, user6(ws-admin), user7(ws-member, has_projects: true)
    workspace2 = f.create_workspace(owner=user6, is_premium=True)
    ws_member_role = workspace2.workspace_roles.exclude(is_admin=True).first()
    f.WorkspaceMembershipFactory.create(user=user7, workspace=workspace2, workspace_role=ws_member_role)
    # user7 is not a pj-member and ws-members are not allowed
    f.create_project(workspace=workspace2, owner=user6)

    # workspace premium, user6(ws-admin), user7(ws-member, has_projects: false)
    workspace3 = f.create_workspace(owner=user6, is_premium=True)
    ws_member_role = workspace3.workspace_roles.exclude(is_admin=True).first()
    f.WorkspaceMembershipFactory.create(user=user7, workspace=workspace3, workspace_role=ws_member_role)

    # workspace premium, user6(ws-admin), user7(ws-member)
    workspace4 = f.create_workspace(owner=user6, is_premium=True)
    ws_member_role = workspace4.workspace_roles.exclude(is_admin=True).first()
    f.WorkspaceMembershipFactory.create(user=user7, workspace=workspace4, workspace_role=ws_member_role)
    # user7 is pj-member
    pj41 = f.create_project(workspace=workspace4, owner=user6)
    pj_general_role = pj41.roles.get(slug="general")
    f.MembershipFactory.create(user=user7, project=pj41, role=pj_general_role)
    # user7 is pj-member but its role has no-access, ws-members have permissions
    pj41 = f.create_project(workspace=workspace4, owner=user6)
    pj_general_role = pj41.roles.get(slug="general")
    f.MembershipFactory.create(user=user7, project=pj41, role=pj_general_role)
    pj_general_role.permissions = []
    pj_general_role.save()
    pj41.workspace_member_permissions = ["view_us"]
    pj41.save()

    res = repositories.get_workspace_projects_for_user(workspace1.id, user6.id)
    assert len(res) == 4
    res = repositories.get_workspace_projects_for_user(workspace1.id, user7.id)
    assert len(res) == 3

    res = repositories.get_workspace_projects_for_user(workspace2.id, user6.id)
    assert len(res) == 1
    res = repositories.get_workspace_projects_for_user(workspace2.id, user7.id)
    assert len(res) == 0

    res = repositories.get_workspace_projects_for_user(workspace3.id, user6.id)
    assert len(res) == 0
    res = repositories.get_workspace_projects_for_user(workspace3.id, user7.id)
    assert len(res) == 0

    res = repositories.get_workspace_projects_for_user(workspace4.id, user6.id)
    assert len(res) == 2
    res = repositories.get_workspace_projects_for_user(workspace4.id, user7.id)
    assert len(res) == 1
