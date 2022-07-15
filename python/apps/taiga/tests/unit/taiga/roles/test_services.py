# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import patch

import pytest
from taiga.roles import services
from taiga.roles.services import exceptions as ex
from tests.utils import factories as f

#######################################################
# get_project_role
#######################################################


async def test_get_project_role():
    project = f.build_project()
    slug = "general"

    with patch("taiga.roles.services.roles_repositories", autospec=True) as fake_role_repository:
        fake_role_repository.get_project_role.return_value = f.build_project_role()
        await services.get_project_role(project=project, slug=slug)
        fake_role_repository.get_project_role.assert_awaited_once()


#######################################################
# update_project_role
#######################################################


async def test_update_project_role_permissions_is_admin():
    role = f.build_project_role(is_admin=True)
    permissions = []

    with pytest.raises(ex.NonEditableRoleError):
        await services.update_project_role_permissions(role=role, permissions=permissions)


async def test_update_project_role_permissions_incompatible_permissions():
    role = f.build_project_role(is_admin=False)
    permissions = ["view_task"]

    with pytest.raises(ex.IncompatiblePermissionsSetError):
        await services.update_project_role_permissions(role=role, permissions=permissions)


async def test_update_project_role_permissions_not_valid_permissions():
    role = f.build_project_role(is_admin=False)
    permissions = ["not_valid", "foo", "bar"]

    with pytest.raises(ex.NotValidPermissionsSetError):
        await services.update_project_role_permissions(role=role, permissions=permissions)


async def test_update_project_role_permissions_ok():
    role = f.build_project_role()
    permissions = ["view_us"]

    with patch("taiga.roles.services.roles_repositories", autospec=True) as fake_role_repository:
        fake_role_repository.update_project_role_permissions.return_value = role
        await services.update_project_role_permissions(role=role, permissions=permissions)
        fake_role_repository.update_project_role_permissions.assert_awaited_once()


#######################################################
# get_paginated_project_memberships
#######################################################


async def test_get_paginated_project_memberships():
    project = f.build_project()
    with patch("taiga.roles.services.roles_repositories", autospec=True) as fake_role_repository:
        await services.get_paginated_project_memberships(project=project, offset=0, limit=10)
        fake_role_repository.get_project_memberships.assert_awaited_once()
        fake_role_repository.get_total_project_memberships.assert_awaited_once()


#######################################################
# update_project_membership_role
#######################################################


async def test_update_project_membership_role_non_existing_role():
    project = f.build_project()
    user = f.build_user()
    general_role = f.build_project_role(project=project, is_admin=False)
    membership = f.build_project_membership(user=user, project=project, role=general_role)
    non_existing_role_slug = "non_existing_role_slug"
    with (
        patch("taiga.roles.services.roles_repositories", autospec=True) as fake_role_repository,
        patch("taiga.roles.services.roles_events", autospec=True) as fake_roles_events,
        pytest.raises(ex.NonExistingRoleError),
    ):
        fake_role_repository.get_project_role.return_value = None

        await services.update_project_membership_role(membership=membership, role_slug=non_existing_role_slug)
        fake_role_repository.get_project_role.assert_awaited_once_with(project=project, slug=non_existing_role_slug)
        fake_role_repository.update_project_membership_role.assert_not_awaited()
        fake_roles_events.emit_event_when_project_membership_role_is_updated.assert_not_awaited()


async def test_update_project_membership_role_only_one_admin():
    project = f.build_project()
    admin_role = f.build_project_role(project=project, is_admin=True)
    membership = f.build_project_membership(user=project.owner, project=project, role=admin_role)
    general_role = f.build_project_role(project=project, is_admin=False)
    with (
        patch("taiga.roles.services.roles_repositories", autospec=True) as fake_role_repository,
        patch("taiga.roles.services.roles_events", autospec=True) as fake_roles_events,
        pytest.raises(ex.MembershipIsTheOnlyAdminError),
    ):
        fake_role_repository.get_project_role.return_value = general_role
        fake_role_repository.get_num_members_by_role_id.return_value = 1

        await services.update_project_membership_role(membership=membership, role_slug=general_role.slug)
        fake_role_repository.get_project_role.assert_awaited_once_with(project=project, slug=general_role.slug)
        fake_role_repository.get_num_members_by_role_id.assert_awaited_once_with(role_id=admin_role.id)
        fake_role_repository.update_project_membership_role.assert_not_awaited()
        fake_roles_events.emit_event_when_project_membership_role_is_updated.assert_not_awaited()


async def test_update_project_membership_role_ok():
    project = f.build_project()
    user = f.build_user()
    general_role = f.build_project_role(project=project, is_admin=False)
    membership = f.build_project_membership(user=user, project=project, role=general_role)
    admin_role = f.build_project_role(project=project, is_admin=True)
    with (
        patch("taiga.roles.services.roles_repositories", autospec=True) as fake_role_repository,
        patch("taiga.roles.services.roles_events", autospec=True) as fake_roles_events,
    ):
        fake_role_repository.get_project_role.return_value = admin_role

        await services.update_project_membership_role(membership=membership, role_slug=admin_role.slug)
        fake_role_repository.get_project_role.assert_awaited_once_with(project=project, slug=admin_role.slug)
        fake_role_repository.get_num_members_by_role_id.assert_not_awaited()
        fake_role_repository.update_project_membership_role.assert_awaited_once_with(
            membership=membership, role=admin_role
        )
        fake_roles_events.emit_event_when_project_membership_role_is_updated.assert_awaited_once_with(
            membership=membership
        )
