# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import patch

import pytest
from taiga.projects.roles import services
from taiga.projects.roles.services import exceptions as ex
from tests.utils import factories as f

#######################################################
# list_project_roles_as_dict
#######################################################


async def test_list_project_roles_as_dict():
    role = f.build_project_role(is_admin=True)

    with patch("taiga.projects.roles.services.pj_roles_repositories", autospec=True) as fake_role_repository:
        fake_role_repository.list_project_roles.return_value = [role]
        ret = await services.list_project_roles_as_dict(project=role.project)

        fake_role_repository.list_project_roles.assert_awaited_once_with(filters={"project_id": role.project_id})
        assert ret[role.slug] == role


#######################################################
# get_project_role
#######################################################


async def test_get_project_role():
    project = f.build_project()
    slug = "general"

    with patch("taiga.projects.roles.services.pj_roles_repositories", autospec=True) as fake_role_repository:
        fake_role_repository.get_project_role.return_value = f.build_project_role()
        await services.get_project_role(project_id=project.id, slug=slug)
        fake_role_repository.get_project_role.assert_awaited_once()


#######################################################
# update_project_role
#######################################################


async def test_update_project_role_permissions_is_admin():
    role = f.build_project_role(is_admin=True)
    permissions = []

    with (
        patch("taiga.projects.roles.services.pj_roles_events", autospec=True) as fake_roles_events,
        pytest.raises(ex.NonEditableRoleError),
    ):
        await services.update_project_role_permissions(role=role, permissions=permissions)
        fake_roles_events.emit_event_when_project_role_permissions_are_updated.assert_not_awaited()


async def test_update_project_role_permissions_ok():
    role = f.build_project_role()
    permissions = ["view_story"]

    with (
        patch("taiga.projects.roles.services.pj_roles_events", autospec=True) as fake_roles_events,
        patch("taiga.projects.roles.services.pj_roles_repositories", autospec=True) as fake_role_repository,
    ):
        fake_role_repository.update_project_role_permissions.return_value = role
        await services.update_project_role_permissions(role=role, permissions=permissions)
        fake_role_repository.update_project_role_permissions.assert_awaited_once()
        fake_roles_events.emit_event_when_project_role_permissions_are_updated.assert_awaited_with(role=role)


async def test_update_project_role_permissions_view_story_deleted():
    role = f.build_project_role()
    permissions = []
    user = f.build_user()
    f.build_project_membership(user=user, project=role.project, role=role)
    story = f.build_story(project=role.project)
    f.build_story_assignment(story=story, user=user)

    with (
        patch("taiga.projects.roles.services.pj_roles_events", autospec=True) as fake_roles_events,
        patch("taiga.projects.roles.services.pj_roles_repositories", autospec=True) as fake_role_repository,
        patch("taiga.projects.roles.services.permissions_services", autospec=True) as fake_permissions_service,
        patch(
            "taiga.projects.roles.services.story_assignments_repositories", autospec=True
        ) as fake_story_assignments_repository,
    ):
        fake_role_repository.update_project_role_permissions.return_value = role
        fake_permissions_service.is_view_story_permission_deleted.return_value = True
        await services.update_project_role_permissions(role=role, permissions=permissions)
        fake_role_repository.update_project_role_permissions.assert_awaited_once()
        fake_roles_events.emit_event_when_project_role_permissions_are_updated.assert_awaited_with(role=role)
        fake_story_assignments_repository.delete_stories_assignments.assert_awaited_once_with(
            filters={"role_id": role.id}
        )
