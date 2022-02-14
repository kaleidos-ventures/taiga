# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import AsyncMock, patch

import pytest
from taiga.exceptions import services as ex
from taiga.roles import services
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


async def test_get_project_role():
    project = await f.create_project()
    slug = "general"

    with patch("taiga.roles.services.roles_repositories", new_callable=AsyncMock) as fake_role_repository:
        fake_role_repository.get_project_role.return_value = await f.create_role()
        await services.get_project_role(project=project, slug=slug)
        fake_role_repository.get_project_role.assert_awaited_once()


async def test_update_role_permissions_is_admin():
    role = await f.create_role(is_admin=True)
    permissions = []

    with pytest.raises(ex.NonEditableRoleError):
        await services.update_role_permissions(role=role, permissions=permissions)


async def test_update_role_permissions_incompatible_permissions():
    role = await f.create_role(is_admin=False)
    permissions = ["view_tasks"]

    with pytest.raises(ex.IncompatiblePermissionsSetError):
        await services.update_role_permissions(role=role, permissions=permissions)


async def test_update_role_permissions_not_valid_permissions():
    role = await f.create_role(is_admin=False)
    permissions = ["not_valid", "foo", "bar"]

    with pytest.raises(ex.NotValidPermissionsSetError):
        await services.update_role_permissions(role=role, permissions=permissions)


async def test_update_role_permissions_ok():
    role = await f.create_role()
    permissions = ["view_us"]

    with patch("taiga.roles.services.roles_repositories", new_callable=AsyncMock) as fake_role_repository:
        fake_role_repository.update_role_permissions.return_value = await f.create_role()
        await services.update_role_permissions(role=role, permissions=permissions)
        fake_role_repository.update_role_permissions.assert_awaited_once()
