# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from asgiref.sync import sync_to_async
from taiga.permissions import choices
from taiga.projects.memberships import repositories as memberships_repositories
from taiga.projects.roles import repositories
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# create_project_roles
##########################################################


async def test_create_project_roles():
    project = await f.create_project()
    project_role_res = await repositories.create_project_role(
        name="project-role",
        slug="slug",
        order=1,
        project=project,
        permissions=[],
        is_admin=True,
    )
    assert project_role_res.name == "project-role"
    assert project_role_res.project == project


##########################################################
# list_project_roles
##########################################################


async def test_list_project_roles_return_roles():
    project = await f.create_project()
    res = await repositories.list_project_roles(filters={"project_id": project.id})
    assert len(res) == 2


##########################################################
# get_project_role
##########################################################


async def test_get_project_role_return_role():
    project = await f.create_project()
    role = await f.create_project_role(
        name="Role test",
        slug="role-test",
        permissions=choices.ProjectPermissions.choices,
        is_admin=True,
        project=project,
    )
    assert await repositories.get_project_role(filters={"project_id": project.id, "slug": "role-test"}) == role


async def test_get_project_role_return_none():
    project = await f.create_project()
    assert await repositories.get_project_role(filters={"project_id": project.id, "slug": "role-not-exist"}) is None


async def test_get_project_role_for_user_admin():
    user = await f.create_user()
    project = await f.create_project(owner=user)
    role = await sync_to_async(project.roles.get)(slug="admin")

    assert await repositories.get_project_role(filters={"user_id": user.id, "project_id": project.id}) == role


async def test_get_project_role_for_user_member():
    user = await f.create_user()
    project = await f.create_project()
    role = await sync_to_async(project.roles.exclude(slug="admin").first)()
    await memberships_repositories.create_project_membership(user=user, project=project, role=role)

    assert await repositories.get_project_role(filters={"user_id": user.id, "project_id": project.id}) == role


async def test_get_project_role_for_user_none():
    user = await f.create_user()
    project = await f.create_project()

    assert await repositories.get_project_role(filters={"user_id": user.id, "project_id": project.id}) is None


##########################################################
# update roles permissions
##########################################################


async def test_update_project_role_permissions():
    role = await f.create_project_role()
    updated_role = await repositories.update_project_role_permissions(
        role=role,
        values={"permissions": ["view_story"]},
    )
    assert "view_story" in updated_role.permissions
