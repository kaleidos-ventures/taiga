# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from asgiref.sync import sync_to_async
from taiga.permissions import choices
from taiga.projects.models import Project
from taiga.roles import repositories
from taiga.roles.models import Membership
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# get_project_role
##########################################################


async def test_get_project_role_return_role():
    project = await f.create_project()
    role = await f.create_role(
        name="Role test",
        slug="role-test",
        permissions=choices.PROJECT_ADMIN_PERMISSIONS,
        is_admin=True,
        project=project,
    )
    assert await repositories.get_project_role(project=project, slug="role-test") == role


async def test_get_project_role_return_none():
    project = await f.create_project()
    assert await repositories.get_project_role(project=project, slug="role-not-exist") is None


##########################################################
# get_project_roles
##########################################################


async def test_get_project_roles_return_roles():
    project = await f.create_project()
    res = await repositories.get_project_roles(project=project)
    assert len(res) == 2


##########################################################
# get_num_members_by_role_id
##########################################################


async def test_get_num_members_by_role_id():
    project = await f.create_project()
    user = await f.create_user()
    user2 = await f.create_user()

    role = await f.create_role(
        name="Role test",
        slug="role-test",
        permissions=choices.PROJECT_PERMISSIONS,
        is_admin=True,
        project=project,
    )
    await f.create_membership(user=user, project=project, role=role)
    await f.create_membership(user=user2, project=project, role=role)
    res = await repositories.get_num_members_by_role_id(role_id=role.id)
    assert res == 2


async def test_get_num_members_by_role_id_no_members():
    project = await f.create_project()
    role = await f.create_role(
        name="Role test",
        slug="role-test",
        permissions=choices.PROJECT_ADMIN_PERMISSIONS,
        is_admin=True,
        project=project,
    )
    assert await repositories.get_num_members_by_role_id(role_id=role.id) == 0


##########################################################
# update roles permissions
##########################################################


async def test_update_role_permissions():
    role = await f.create_role()
    role = await repositories.update_role_permissions(role, ["view_project"])
    assert "view_project" in role.permissions


##########################################################
# create_membership
##########################################################


@sync_to_async
def _get_memberships(project: Project) -> list[Membership]:
    return list(project.memberships.all())


async def test_create_membership():
    user = await f.create_user()
    user2 = await f.create_user()
    project = await f.create_project(owner=user)
    role = await f.create_role(project=project)
    membership = await repositories.create_membership(user=user2, project=project, role=role, email=None)
    memberships = await _get_memberships(project=project)
    assert membership in memberships
