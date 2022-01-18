# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import patch

import pytest
from taiga.exceptions import services as ex
from taiga.roles import services
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


def test_get_project_role():
    with patch("taiga.roles.services.roles_repo") as fake_role_repository:
        fake_role_repository.get_project_role.return_value = f.RoleFactory()
        services.get_project_role(project=f.ProjectFactory(), slug="general")
        fake_role_repository.get_project_role.assert_called_once()


def test_update_role_permissions_is_admin():
    with pytest.raises(ex.NonEditableRoleError):
        services.update_role_permissions(role=f.RoleFactory(is_admin=True), permissions=[])


def test_update_role_permissions_incompatible_permissions():
    with pytest.raises(ex.IncompatiblePermissionsSetError):
        services.update_role_permissions(
            role=f.RoleFactory(is_admin=False), permissions=["view_tasks", "view_milestones"]
        )


def test_update_role_permissions_not_valid_permissions():
    with pytest.raises(ex.NotValidPermissionsSetError):
        services.update_role_permissions(role=f.RoleFactory(is_admin=False), permissions=["not_valid", "foo", "bar"])


def test_update_role_permissions_ok():
    with patch("taiga.roles.services.roles_repo") as fake_role_repository:
        fake_role_repository.update_role_permissions.return_value = f.RoleFactory()
        services.update_role_permissions(role=f.RoleFactory(), permissions=["view_project", "view_us"])
        fake_role_repository.update_role_permissions.assert_called_once()
