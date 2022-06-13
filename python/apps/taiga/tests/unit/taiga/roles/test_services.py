# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import patch

import pytest
from taiga.roles import exceptions as ex
from taiga.roles import services
from tests.utils import factories as f

#######################################################
# get_project_role
#######################################################


async def test_get_project_role():
    project = f.build_project()
    slug = "general"

    with patch("taiga.roles.services.roles_repositories", autospec=True) as fake_role_repository:
        fake_role_repository.get_project_role.return_value = f.build_role()
        await services.get_project_role(project=project, slug=slug)
        fake_role_repository.get_project_role.assert_awaited_once()


#######################################################
# update_project_role
#######################################################


async def test_update_role_permissions_is_admin():
    role = f.build_role(is_admin=True)
    permissions = []

    with pytest.raises(ex.NonEditableRoleError):
        await services.update_role_permissions(role=role, permissions=permissions)


async def test_update_role_permissions_incompatible_permissions():
    role = f.build_role(is_admin=False)
    permissions = ["view_tasks"]

    with pytest.raises(ex.IncompatiblePermissionsSetError):
        await services.update_role_permissions(role=role, permissions=permissions)


async def test_update_role_permissions_not_valid_permissions():
    role = f.build_role(is_admin=False)
    permissions = ["not_valid", "foo", "bar"]

    with pytest.raises(ex.NotValidPermissionsSetError):
        await services.update_role_permissions(role=role, permissions=permissions)


async def test_update_role_permissions_ok():
    role = f.build_role()
    permissions = ["view_us"]

    with patch("taiga.roles.services.roles_repositories", autospec=True) as fake_role_repository:
        fake_role_repository.update_role_permissions.return_value = role
        await services.update_role_permissions(role=role, permissions=permissions)
        fake_role_repository.update_role_permissions.assert_awaited_once()


#######################################################
# get_paginated_project_memberships
#######################################################


async def test_get_paginated_project_memberships():
    project = f.build_project()
    with patch("taiga.roles.services.roles_repositories", autospec=True) as fake_role_repository:
        await services.get_paginated_project_memberships(project=project, offset=0, limit=10)
        fake_role_repository.get_project_memberships.assert_awaited_once()
        fake_role_repository.get_total_project_memberships.assert_awaited_once()
