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
# get_workspace_projects_for_user
##########################################################


def test_get_workspace_projects_for_user():
    ws_admin = f.UserFactory(username="ws_admin")
    ws_member = f.UserFactory(username="ws_member")
    ws_guest = f.UserFactory(username="ws_guest")

    # workspace premium with ws_admin and ws_member
    workspace = f.create_workspace(owner=ws_admin, is_premium=True)
    ws_member_role = workspace.workspace_roles.exclude(is_admin=True).first()
    f.WorkspaceMembershipFactory.create(user=ws_member, workspace=workspace, workspace_role=ws_member_role)

    # ws_member is pj_member
    # visible by ws_admin and ws_member
    pj1 = f.create_project(workspace=workspace)
    pj_general_role = pj1.roles.get(slug="general")
    f.MembershipFactory.create(user=ws_member, project=pj1, role=pj_general_role)

    # ws_member is not pj_member but ws_members have perms
    # visible by ws_admin, ws_member and ws_guest
    pj2 = f.create_project(workspace=workspace)
    pj2.workspace_member_permissions = ["view_us"]
    pj2.save()

    # ws_member is not pj_member and ws_members dont have perms
    # visible by ws_admin
    f.create_project(workspace=workspace)

    res = repositories.get_workspace_projects_for_user(workspace.id, ws_admin.id)
    assert len(res) == 3

    res = repositories.get_workspace_projects_for_user(workspace.id, ws_member.id)
    assert len(res) == 2

    res = repositories.get_workspace_projects_for_user(workspace.id, ws_guest.id)
    assert len(res) == 1
