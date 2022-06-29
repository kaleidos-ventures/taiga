# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import patch

import pytest
from taiga.conf import settings
from taiga.integrations.gitlab import exceptions as ex
from taiga.integrations.gitlab.auth import services
from taiga.integrations.gitlab.dataclasses import GitlabUserProfile
from tests.utils import factories as f

##########################################################
# gitlab_login
##########################################################


async def test_gitlab_login_ok():
    settings.GITLAB_CLIENT_ID = "id"
    settings.GITLAB_CLIENT_SECRET = "secret"
    settings.GITLAB_URL = "https://gitlab.com"
    with (
        patch("taiga.integrations.gitlab.auth.services.gitlab_services", autospec=True) as fake_gitlab_services,
        patch("taiga.integrations.gitlab.auth.services._gitlab_login", autospec=True) as fake_gitlab_auth_services,
    ):
        fake_gitlab_services.get_access_to_gitlab.return_value = "access_token"
        fake_gitlab_services.get_user_info_from_gitlab.return_value = GitlabUserProfile(
            email="email@test.com", full_name="Full Name", gitlab_id="1", bio="Bio"
        )
        await services.gitlab_login(code="code", redirect_uri="https://redirect.uri")
        fake_gitlab_auth_services.assert_awaited_once()


async def test_gitlab_login_gitlab_not_configured():
    settings.GITLAB_CLIENT_ID = None
    settings.GITLAB_CLIENT_SECRET = None
    settings.GITLAB_URL = None
    with (pytest.raises(ex.GitlabLoginError)):
        await services.gitlab_login(code="code", redirect_uri="https://redirect.uri")


async def test_gitlab_login_invalid_code():
    settings.GITLAB_CLIENT_ID = "id"
    settings.GITLAB_CLIENT_SECRET = "secret"
    settings.GITLAB_URL = "https://gitlab.com"
    with (
        patch("taiga.integrations.gitlab.auth.services.gitlab_services", autospec=True) as fake_gitlab_services,
        pytest.raises(ex.GitlabLoginAuthenticationError),
    ):
        fake_gitlab_services.get_access_to_gitlab.return_value = None
        await services.gitlab_login(code="code", redirect_uri="https://redirect.uri")


async def test_gitlab_login_gitlab_api_not_responding():
    settings.GITLAB_CLIENT_ID = "id"
    settings.GITLAB_CLIENT_SECRET = "secret"
    settings.GITLAB_URL = "https://gitlab.com"
    with (
        patch("taiga.integrations.gitlab.auth.services.gitlab_services", autospec=True) as fake_gitlab_services,
        pytest.raises(ex.GitlabAPIError),
    ):
        fake_gitlab_services.get_access_to_gitlab.return_value = "access_token"
        fake_gitlab_services.get_user_info_from_gitlab.return_value = None
        await services.gitlab_login(code="code", redirect_uri="https://redirect.uri")


##########################################################
# _gitlab_login
##########################################################


async def test_priv_gitlab_login_user_has_authdata():
    with (
        patch("taiga.integrations.gitlab.auth.services.users_repositories", autospec=True) as fake_users_repositories,
        patch("taiga.integrations.gitlab.auth.services.auth_services", autospec=True) as fake_auth_services,
    ):
        user = f.build_user()
        fake_users_repositories.get_user_from_auth_data.return_value = user

        await services._gitlab_login(email="", full_name="", gitlab_id="", bio="")

        fake_auth_services.create_auth_credentials.assert_awaited_once()
        fake_users_repositories.get_first_user.assert_not_awaited()


async def test_priv_gitlab_login_user_no_auth_data():
    with (
        patch("taiga.integrations.gitlab.auth.services.users_repositories", autospec=True) as fake_users_repositories,
        patch("taiga.integrations.gitlab.auth.services.users_services", autospec=True) as fake_users_services,
        patch("taiga.integrations.gitlab.auth.services.auth_services", autospec=True) as fake_auth_services,
    ):
        user = f.build_user()
        fake_users_repositories.get_user_from_auth_data.return_value = None
        fake_users_repositories.get_first_user.return_value = user

        await services._gitlab_login(email="", full_name="", gitlab_id="", bio="")

        fake_users_services._generate_username.assert_not_awaited()
        fake_auth_services.create_auth_credentials.assert_awaited_once()
        fake_users_repositories.create_auth_data.assert_awaited_once()


async def test_priv_gitlab_login_no_user():
    with (
        patch("taiga.integrations.gitlab.auth.services.users_repositories", autospec=True) as fake_users_repositories,
        patch("taiga.integrations.gitlab.auth.services.users_services", autospec=True) as fake_users_services,
        patch("taiga.integrations.gitlab.auth.services.auth_services", autospec=True) as fake_auth_services,
    ):
        fake_users_repositories.get_user_from_auth_data.return_value = None
        fake_users_repositories.get_first_user.return_value = None

        await services._gitlab_login(email="", full_name="", gitlab_id="", bio="")

        fake_users_services._generate_username.assert_awaited_once()
        fake_auth_services.create_auth_credentials.assert_awaited_once()
        fake_users_repositories.create_auth_data.assert_awaited_once()
        fake_users_repositories.create_user.assert_awaited_once()
