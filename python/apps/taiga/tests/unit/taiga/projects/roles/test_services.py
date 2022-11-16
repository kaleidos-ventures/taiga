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
# get_project_role
#######################################################


async def test_get_project_role():
    project = f.build_project()
    slug = "general"

    with patch("taiga.projects.roles.services.pj_roles_repositories", autospec=True) as fake_role_repository:
        fake_role_repository.get_project_role.return_value = f.build_project_role()
        await services.get_project_role(project=project, slug=slug)
        fake_role_repository.get_project_role.assert_awaited_once()


#######################################################
# get_project_roles_as_dict
#######################################################


async def test_get_project_roles_as_dict():
    role = f.build_project_role(is_admin=True)

    with patch("taiga.projects.roles.services.pj_roles_repositories", autospec=True) as fake_role_repository:
        fake_role_repository.get_project_roles.return_value = [role]
        ret = await services.get_project_roles_as_dict(project=role.project)

        fake_role_repository.get_project_roles.assert_awaited_once_with(filters={"project_id": role.project_id})
        assert ret[role.slug] == role


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


async def test_update_project_role_permissions_incompatible_permissions():
    role = f.build_project_role(is_admin=False)
    permissions = ["view_task"]

    with (
        patch("taiga.projects.roles.services.pj_roles_events", autospec=True) as fake_roles_events,
        pytest.raises(ex.IncompatiblePermissionsSetError),
    ):
        await services.update_project_role_permissions(role=role, permissions=permissions)
        fake_roles_events.emit_event_when_project_role_permissions_are_updated.assert_not_awaited()


async def test_update_project_role_permissions_not_valid_permissions():
    role = f.build_project_role(is_admin=False)
    permissions = ["not_valid", "foo", "bar"]

    with (
        patch("taiga.projects.roles.services.pj_roles_events", autospec=True) as fake_roles_events,
        pytest.raises(ex.NotValidPermissionsSetError),
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
