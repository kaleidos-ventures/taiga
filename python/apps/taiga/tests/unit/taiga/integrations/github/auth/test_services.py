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
from taiga.integrations.github.schemas import GithubUserProfileSchema

##########################################################
# github_login
##########################################################


async def test_github_login_ok():
    settings.GITHUB_CLIENT_ID = "id"
    settings.GITHUB_CLIENT_SECRET = "secret"
    with (
        patch("taiga.integrations.github.auth.services.github_services", autospec=True) as fake_github_services,
        patch(
            "taiga.integrations.github.auth.services.integrations_auth_services", autospec=True
        ) as fake_integrations_auth_services,
    ):
        fake_github_services.get_access_to_github.return_value = "access_token"
        fake_github_services.get_user_info_from_github.return_value = GithubUserProfileSchema(
            email="email@test.com", full_name="Full Name", github_id="1", bio="Bio"
        )
        await services.github_login(code="code", lang="es-ES")
        fake_integrations_auth_services.social_login.assert_awaited_once()


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
