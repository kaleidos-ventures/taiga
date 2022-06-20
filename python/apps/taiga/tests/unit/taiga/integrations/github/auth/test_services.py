# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import patch

import pytest
from taiga.conf import settings
from taiga.integrations.github import exceptions as ex
from taiga.integrations.github.auth import services
from taiga.integrations.github.dataclasses import GithubUserProfile
from tests.utils import factories as f

##########################################################
# github_login
##########################################################


async def test_github_login_ok():
    settings.GITHUB_CLIENT_ID = "id"
    settings.GITHUB_CLIENT_SECRET = "secret"
    with (
        patch("taiga.integrations.github.auth.services.github_services", autospec=True) as fake_github_services,
        patch("taiga.integrations.github.auth.services._github_login", autospec=True) as fake_github_auth_services,
    ):
        fake_github_services.get_access_to_github.return_value = "access_token"
        fake_github_services.get_user_info_from_github.return_value = GithubUserProfile(
            email="email@test.com", full_name="Full Name", github_id="1", bio="Bio"
        )
        await services.github_login(code="code")
        fake_github_auth_services.assert_awaited_once()


async def test_github_login_github_not_configured():
    settings.GITHUB_CLIENT_ID = None
    settings.GITHUB_CLIENT_SECRET = None
    with (pytest.raises(ex.GithubLoginError)):
        await services.github_login(code="code")


async def test_github_login_invalid_code():
    settings.GITHUB_CLIENT_ID = "id"
    settings.GITHUB_CLIENT_SECRET = "secret"
    with (
        patch("taiga.integrations.github.auth.services.github_services", autospec=True) as fake_github_services,
        pytest.raises(ex.GithubLoginAuthenticationError),
    ):
        fake_github_services.get_access_to_github.return_value = None
        await services.github_login(code="invalid-code")


async def test_github_login_github_api_not_responding():
    settings.GITHUB_CLIENT_ID = "id"
    settings.GITHUB_CLIENT_SECRET = "secret"
    with (
        patch("taiga.integrations.github.auth.services.github_services", autospec=True) as fake_github_services,
        pytest.raises(ex.GithubAPIError),
    ):
        fake_github_services.get_access_to_github.return_value = "access_token"
        fake_github_services.get_user_info_from_github.return_value = None
        await services.github_login(code="code")


##########################################################
# _github_login
##########################################################


async def test_priv_github_login_user_has_authdata():
    with (
        patch("taiga.integrations.github.auth.services.users_repositories", autospec=True) as fake_users_repositories,
        patch("taiga.integrations.github.auth.services.auth_services", autospec=True) as fake_auth_services,
    ):
        user = f.build_user()
        fake_users_repositories.get_user_from_auth_data.return_value = user

        await services._github_login(email="", full_name="", github_id="", bio="")

        fake_auth_services.create_auth_credentials.assert_awaited_once()
        fake_users_repositories.get_first_user.assert_not_awaited()


async def test_priv_github_login_user_no_auth_data():
    with (
        patch("taiga.integrations.github.auth.services.users_repositories", autospec=True) as fake_users_repositories,
        patch("taiga.integrations.github.auth.services.users_services", autospec=True) as fake_users_services,
        patch("taiga.integrations.github.auth.services.auth_services", autospec=True) as fake_auth_services,
    ):
        user = f.build_user()
        fake_users_repositories.get_user_from_auth_data.return_value = None
        fake_users_repositories.get_first_user.return_value = user

        await services._github_login(email="", full_name="", github_id="", bio="")

        fake_users_services._generate_username.assert_not_awaited()
        fake_auth_services.create_auth_credentials.assert_awaited_once()
        fake_users_repositories.create_auth_data.assert_awaited_once()


async def test_priv_github_login_no_user():
    with (
        patch("taiga.integrations.github.auth.services.users_repositories", autospec=True) as fake_users_repositories,
        patch("taiga.integrations.github.auth.services.users_services", autospec=True) as fake_users_services,
        patch("taiga.integrations.github.auth.services.auth_services", autospec=True) as fake_auth_services,
    ):
        fake_users_repositories.get_user_from_auth_data.return_value = None
        fake_users_repositories.get_first_user.return_value = None

        await services._github_login(email="", full_name="", github_id="", bio="")

        fake_users_services._generate_username.assert_awaited_once()
        fake_auth_services.create_auth_credentials.assert_awaited_once()
        fake_users_repositories.create_auth_data.assert_awaited_once()
        fake_users_repositories.create_user.assert_awaited_once()
