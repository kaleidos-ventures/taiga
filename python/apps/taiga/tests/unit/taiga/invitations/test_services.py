# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import patch

import pytest
from taiga.invitations import services
from taiga.roles import exceptions as roles_ex
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


async def test_create_invitations_non_existing_role():
    user = await f.create_user()
    project = await f.create_project(owner=user)
    await f.create_role(project=project)
    invitations = [{"email": "test@email.com", "role_slug": "non_existing_role"}]

    with pytest.raises(roles_ex.NonExistingRoleError):
        await services.create_invitations(project=project, invitations=invitations, invited_by=user)


async def test_create_invitations():
    user = await f.create_user()
    await f.create_user(email="user-test@email.com")
    project = await f.create_project(owner=user)
    await f.create_role(project=project)
    invitations = [
        {"email": "user-test@email.com", "role_slug": "admin"},
        {"email": "test@email.com", "role_slug": "general"},
    ]

    with patch("taiga.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo:
        await services.create_invitations(project=project, invitations=invitations, invited_by=user)

        fake_invitations_repo.create_invitations.assert_awaited_once()


async def test_get_project_invitations():
    project = f.build_project()
    with patch("taiga.invitations.services.invitations_repositories", autospec=True) as fake_invitations_repo:
        await services.get_project_invitations(project=project)

        fake_invitations_repo.get_project_invitations.assert_awaited_once()
