# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from asgiref.sync import sync_to_async
from taiga.permissions import choices
from taiga.projects.memberships import repositories
from taiga.projects.memberships.models import ProjectMembership
from taiga.projects.projects.models import Project
from taiga.workspaces.memberships import repositories as ws_memberships_repositories
from taiga.workspaces.memberships.models import WorkspaceMembership
from taiga.workspaces.workspaces.models import Workspace
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# create_project_membership
##########################################################


@sync_to_async
def _get_memberships(project: Project) -> list[ProjectMembership]:
    return list(project.memberships.all())


async def test_create_project_membership():
    user = await f.create_user()
    project = await f.create_project()
    role = await f.create_project_role(project=project)
    membership = await repositories.create_project_membership(user=user, project=project, role=role)
    memberships = await _get_memberships(project=project)
    assert membership in memberships


##########################################################
# get_project_members
##########################################################


async def test_get_project_members():
    user = await f.create_user()
    project = await f.create_project()
    role = await f.create_project_role(project=project)

    project_member = await repositories.get_project_members(project=project)
    assert len(project_member) == 1

    await repositories.create_project_membership(user=user, project=project, role=role)

    project_member = await repositories.get_project_members(project=project)
    assert len(project_member) == 2


##########################################################
# get_project_memberships
##########################################################


async def test_get_project_memberships():
    owner = await f.create_user()
    user1 = await f.create_user()
    user2 = await f.create_user()
    project = await f.create_project(owner=owner)
    role = await f.create_project_role(project=project)
    await repositories.create_project_membership(user=user1, project=project, role=role)
    await repositories.create_project_membership(user=user2, project=project, role=role)

    memberships = await repositories.get_project_memberships(project_slug=project.slug, offset=0, limit=100)
    assert len(memberships) == 3


##########################################################
# get_project_membership
##########################################################


async def test_get_project_membership():
    owner = await f.create_user()
    user = await f.create_user()
    project = await f.create_project(owner=owner)
    role = await f.create_project_role(project=project)
    membership = await repositories.create_project_membership(user=user, project=project, role=role)

    assert await repositories.get_project_membership(project_slug=project.slug, username=user.username) == membership


##########################################################
# get_total_project_memberships
##########################################################


async def test_get_total_project_memberships():
    owner = await f.create_user()
    user1 = await f.create_user()
    user2 = await f.create_user()
    project = await f.create_project(owner=owner)
    role = await f.create_project_role(project=project)
    await repositories.create_project_membership(user=user1, project=project, role=role)
    await repositories.create_project_membership(user=user2, project=project, role=role)

    total_memberships = await repositories.get_total_project_memberships(project_slug=project.slug)
    assert total_memberships == 3


##########################################################
# update_project_membership
##########################################################


async def test_update_project_membership():
    owner = await f.create_user()
    user = await f.create_user()
    project = await f.create_project(owner=owner)
    role = await f.create_project_role(project=project)
    membership = await repositories.create_project_membership(user=user, project=project, role=role)

    new_role = await f.create_project_role(project=project)
    updated_membership = await repositories.update_project_membership(membership=membership, role=new_role)
    assert updated_membership.role == new_role


##########################################################
# get_num_members_by_role_id
##########################################################


async def test_get_num_members_by_role_id():
    project = await f.create_project()
    user = await f.create_user()
    user2 = await f.create_user()

    role = await f.create_project_role(
        name="Role test",
        slug="role-test",
        permissions=choices.ProjectPermissions.choices,
        is_admin=True,
        project=project,
    )
    await f.create_project_membership(user=user, project=project, role=role)
    await f.create_project_membership(user=user2, project=project, role=role)
    res = await repositories.get_num_members_by_role_id(role_id=role.id)
    assert res == 2


async def test_get_num_members_by_role_id_no_members():
    project = await f.create_project()
    role = await f.create_project_role(
        name="Role test",
        slug="role-test",
        permissions=choices.ProjectPermissions.choices,
        is_admin=True,
        project=project,
    )
    assert await repositories.get_num_members_by_role_id(role_id=role.id) == 0


##########################################################
# create_workspace_membership
##########################################################
@sync_to_async
def _get_workspace_memberships(workspace: Workspace) -> list[WorkspaceMembership]:
    return list(workspace.memberships.all())


async def test_create_workspace_membership():
    user = await f.create_user()
    workspace = await f.create_workspace()
    role = await f.create_workspace_role(workspace=workspace)
    membership = await ws_memberships_repositories.create_workspace_membership(
        user=user, workspace=workspace, role=role
    )
    memberships = await _get_workspace_memberships(workspace=workspace)
    assert membership in memberships


##########################################################
# user_is_project_member
##########################################################


async def test_user_is_project_member():
    owner = await f.create_user()
    user1 = await f.create_user()
    user2 = await f.create_user()
    project = await f.create_project(owner=owner)
    role = await f.create_project_role(project=project)
    await repositories.create_project_membership(user=user1, project=project, role=role)

    owner_is_member = await repositories.user_is_project_member(project_slug=project.slug, user_id=owner.id)
    user1_is_member = await repositories.user_is_project_member(project_slug=project.slug, user_id=user1.id)
    user2_is_member = await repositories.user_is_project_member(project_slug=project.slug, user_id=user2.id)

    assert owner_is_member is True
    assert user1_is_member is True
    assert user2_is_member is False
