# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from unittest.mock import patch

from taiga.integrations.auth import services
from tests.utils import factories as f

##########################################################
# social_login
##########################################################


async def test_social_login_user_has_authdata():
    with (
        patch("taiga.integrations.auth.services.users_repositories", autospec=True) as fake_users_repositories,
        patch("taiga.integrations.auth.services.auth_services", autospec=True) as fake_auth_services,
    ):
        auth_data = f.build_auth_data()
        fake_users_repositories.get_auth_data.return_value = auth_data

        await services.social_login(email="", full_name="", social_key="", social_id="", bio="")

        fake_auth_services.create_auth_credentials.assert_awaited_once()
        fake_users_repositories.get_user.assert_not_awaited()


async def test_social_login_user_no_auth_data():
    with (
        patch("taiga.integrations.auth.services.users_repositories", autospec=True) as fake_users_repositories,
        patch("taiga.integrations.auth.services.users_services", autospec=True) as fake_users_services,
        patch("taiga.integrations.auth.services.auth_services", autospec=True) as fake_auth_services,
    ):
        user = f.build_user()
        fake_users_repositories.get_auth_data.return_value = None
        fake_users_repositories.get_user.return_value = user

        await services.social_login(email="", full_name="", social_key="", social_id="", bio="")

        fake_users_services.generate_username.assert_not_awaited()
        fake_auth_services.create_auth_credentials.assert_awaited_once()
        fake_users_repositories.create_auth_data.assert_awaited_once()


async def test_social_login_no_user():
    with (
        patch("taiga.integrations.auth.services.users_repositories", autospec=True) as fake_users_repositories,
        patch("taiga.integrations.auth.services.users_services", autospec=True) as fake_users_services,
        patch("taiga.integrations.auth.services.auth_services", autospec=True) as fake_auth_services,
        patch("taiga.integrations.auth.services.invitations_services", autospec=True) as fake_invitations_services,
    ):
        fake_users_repositories.get_auth_data.return_value = None
        fake_users_repositories.get_user.return_value = None

        await services.social_login(email="", full_name="", social_key="", social_id="", bio="")

        fake_users_services.generate_username.assert_awaited_once()
        fake_auth_services.create_auth_credentials.assert_awaited_once()
        fake_users_repositories.create_auth_data.assert_awaited_once()
        fake_users_repositories.create_user.assert_awaited_once()
        fake_invitations_services.update_user_projects_invitations.assert_awaited_once()
