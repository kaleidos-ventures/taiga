# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from asgiref.sync import sync_to_async
from django.core.files import File
from taiga.conf import settings
from taiga.projects import repositories
from taiga.projects.models import Project
from taiga.roles.models import Role, WorkspaceRole
from taiga.workspaces.models import Workspace
from tests.utils import factories as f
from tests.utils.images import valid_image_f

pytestmark = pytest.mark.django_db


##########################################################
# utils
##########################################################


@sync_to_async
def _get_ws_member_role(workspace: Workspace) -> WorkspaceRole:
    return workspace.workspace_roles.exclude(is_admin=True).first()


@sync_to_async
def _get_pj_member_role(project: Project) -> Role:
    return project.roles.get(slug="general")


@sync_to_async
def _save_project(project: Project) -> Project:
    return project.save()


@sync_to_async
def _save_role(role: Role) -> Role:
    return role.save()


##########################################################
# get_project
##########################################################


async def test_get_projects():
    user = await f.create_user()
    workspace = await f.create_workspace(owner=user)
    await f.create_project(workspace=workspace, owner=user)
    await f.create_project(workspace=workspace, owner=user)
    await f.create_project(workspace=workspace, owner=user)
    res = await repositories.get_projects(workspace_slug=workspace.slug)
    assert len(res) == 3


##########################################################
# create_project
##########################################################


async def test_create_project_with_non_ASCI_chars():
    workspace = await f.create_workspace()
    template = await repositories.get_template(slug=settings.DEFAULT_PROJECT_TEMPLATE)
    project = await repositories.create_project(
        name="My proj#%&乕شect", description="", color=3, owner=workspace.owner, workspace=workspace, template=template
    )
    assert project.slug.startswith("my-projhu-shect")


async def test_create_project_with_logo():
    workspace = await f.create_workspace()
    template = await repositories.get_template(slug=settings.DEFAULT_PROJECT_TEMPLATE)
    project = await repositories.create_project(
        name="My proj#%&乕شect",
        description="",
        color=3,
        owner=workspace.owner,
        workspace=workspace,
        logo=valid_image_f,
        template=template,
    )
    assert valid_image_f.name in project.logo.name


async def test_create_project_with_no_logo():
    workspace = await f.create_workspace()
    template = await repositories.get_template(slug=settings.DEFAULT_PROJECT_TEMPLATE)
    project = await repositories.create_project(
        name="My proj#%&乕شect",
        description="",
        color=3,
        owner=workspace.owner,
        workspace=workspace,
        logo=None,
        template=template,
    )
    assert project.logo == File(None)


##########################################################
# get_project
##########################################################


async def test_get_project_return_project():
    project = await f.create_project(name="Project 1")
    assert await repositories.get_project(slug=project.slug) == project


async def test_get_project_return_none():
    assert await repositories.get_project(slug="project-not-exist") is None


##########################################################
# get_template
##########################################################


async def test_get_template_return_template():
    template = await f.create_project_template()
    assert await repositories.get_template(slug=template.slug) == template


##########################################################
# update_project_public_permissions
##########################################################


async def test_update_project_public_permissions():
    project = await f.create_project(name="Project 1")
    permissions = ["add_task", "view_tasks", "add_us", "view_us"]
    anon_permissions = ["view_tasks", "view_us"]
    await repositories.update_project_public_permissions(project, permissions, anon_permissions)
    assert len(project.public_permissions) == 4
    assert len(project.anon_permissions) == 2


##########################################################
# update_workspace_member_permissions
##########################################################


async def test_update_project_workspace_member_permissions():
    project = await f.create_project(name="Project 1")
    permissions = ["add_task", "view_tasks", "add_us", "view_us"]
    await repositories.update_project_workspace_member_permissions(project, permissions)
    assert len(project.workspace_member_permissions) == 4


##########################################################
# get_workspace_projects_for_user
##########################################################


async def test_get_workspace_projects_for_user_1():
    user6 = await f.create_user()
    user7 = await f.create_user()

    # workspace premium, user6(ws-admin), user7(ws-member)
    workspace = await f.create_workspace(owner=user6, is_premium=True)
    ws_member_role = await _get_ws_member_role(workspace=workspace)
    await f.create_workspace_membership(user=user7, workspace=workspace, workspace_role=ws_member_role)
    # user7 is a pj-owner
    await f.create_project(workspace=workspace, owner=user7)
    # user7 is pj-member
    pj11 = await f.create_project(workspace=workspace, owner=user6)
    pj_general_role = await _get_pj_member_role(project=pj11)
    await f.create_membership(user=user7, project=pj11, role=pj_general_role)
    # user7 is pj-member, ws-members have permissions
    pj12 = await f.create_project(workspace=workspace, owner=user6)
    pj_general_role = await _get_pj_member_role(project=pj12)
    await f.create_membership(user=user7, project=pj12, role=pj_general_role)
    pj_general_role.permissions = []
    await _save_role(pj_general_role)
    pj12.workspace_member_permissions = ["view_us"]
    await _save_project(project=pj12)
    # user7 is pj-member, ws-members don't have permissions
    pj13 = await f.create_project(workspace=workspace, owner=user6)
    pj_general_role = await _get_pj_member_role(project=pj13)
    await f.create_membership(user=user7, project=pj13, role=pj_general_role)
    pj_general_role.permissions = []
    await _save_role(pj_general_role)
    # user7 is not a pj-member but the project allows 'view_us' to ws-members
    pj14 = await f.create_project(workspace=workspace, owner=user6)
    pj14.workspace_member_permissions = ["view_us"]
    await _save_project(project=pj14)
    # user7 is not a pj-member and ws-members are not allowed
    await f.create_project(workspace=workspace, owner=user6)

    res = await repositories.get_workspace_projects_for_user(workspace.id, user6.id)
    assert len(res) == 5
    res = await repositories.get_workspace_projects_for_user(workspace.id, user7.id)
    assert len(res) == 5


async def test_get_workspace_projects_for_user_2():
    user6 = await f.create_user()
    user7 = await f.create_user()

    # workspace premium, user6(ws-admin), user7(ws-member, has_projects: true)
    workspace = await f.create_workspace(owner=user6, is_premium=True)
    ws_member_role = await _get_ws_member_role(workspace=workspace)
    await f.create_workspace_membership(user=user7, workspace=workspace, workspace_role=ws_member_role)
    # user7 is not a pj-member and ws-members are not allowed
    await f.create_project(workspace=workspace, owner=user6)

    res = await repositories.get_workspace_projects_for_user(workspace.id, user6.id)
    assert len(res) == 1
    res = await repositories.get_workspace_projects_for_user(workspace.id, user7.id)
    assert len(res) == 0


async def test_get_workspace_projects_for_user_3():
    user6 = await f.create_user()
    user7 = await f.create_user()

    # workspace premium, user6(ws-admin), user7(ws-member, has_projects: false)
    workspace = await f.create_workspace(owner=user6, is_premium=True)
    ws_member_role = await _get_ws_member_role(workspace=workspace)
    await f.create_workspace_membership(user=user7, workspace=workspace, workspace_role=ws_member_role)

    res = await repositories.get_workspace_projects_for_user(workspace.id, user6.id)
    assert len(res) == 0
    res = await repositories.get_workspace_projects_for_user(workspace.id, user7.id)
    assert len(res) == 0


##########################################################
# get_workspace_invited_projects_for_user
##########################################################


async def test_get_workspace_invited_projects_for_user():
    user8 = await f.create_user()
    user9 = await f.create_user()

    # workspace premium, user8(ws-admin), user9(ws-member)
    workspace = await f.create_workspace(owner=user8, is_premium=True)
    ws_member_role = await _get_ws_member_role(workspace=workspace)
    await f.create_workspace_membership(user=user9, workspace=workspace, workspace_role=ws_member_role)
    # user8 is a pj-owner of several projects
    pj1 = await f.create_project(workspace=workspace, owner=user8)
    await f.create_project(workspace=workspace, owner=user8)
    pj3 = await f.create_project(workspace=workspace, owner=user8)
    # user8 invites user9 to several projects
    await f.create_invitation(email=user9.email, user=user9, project=pj1, invited_by=user8)
    await f.create_invitation(email=user9.email, user=user9, project=pj3, invited_by=user8)

    res = await repositories.get_workspace_invited_projects_for_user(workspace.id, user9.id)
    assert len(res) == 2
    assert res[0].name == pj1.name
    assert res[1].name == pj3.name
