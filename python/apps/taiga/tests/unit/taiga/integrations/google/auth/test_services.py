# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from unittest.mock import patch

import pytest
from taiga.conf import settings
from taiga.integrations.google import exceptions as ex
from taiga.integrations.google.auth import services
from taiga.integrations.google.services import GoogleUserProfile

##########################################################
# google_login
##########################################################


async def test_google_login_ok():
    settings.GOOGLE_CLIENT_ID = "id"
    settings.GOOGLE_CLIENT_SECRET = "secret"
    with (
        patch("taiga.integrations.google.auth.services.google_services", autospec=True) as fake_google_services,
        patch(
            "taiga.integrations.google.auth.services.integrations_auth_services", autospec=True
        ) as fake_integrations_auth_services,
    ):
        fake_google_services.get_access_to_google.return_value = "access_token"
        fake_google_services.get_user_info_from_google.return_value = GoogleUserProfile(
            email="email@test.com", full_name="Full Name", google_id="1", bio="Bio"
        )
        await services.google_login(code="code", redirect_uri="https://redirect.uri", lang="es-ES")
        fake_integrations_auth_services.social_login.assert_awaited_once()


async def test_google_login_google_not_configured():
    settings.GOOGLE_CLIENT_ID = None
    settings.GOOGLE_CLIENT_SECRET = None
    with (pytest.raises(ex.GoogleLoginError)):
        await services.google_login(code="code", redirect_uri="https://redirect.uri")


async def test_google_login_invalid_code():
    settings.GOOGLE_CLIENT_ID = "id"
    settings.GOOGLE_CLIENT_SECRET = "secret"
    with (
        patch("taiga.integrations.google.auth.services.google_services", autospec=True) as fake_google_services,
        pytest.raises(ex.GoogleLoginAuthenticationError),
    ):
        fake_google_services.get_access_to_google.return_value = None
        await services.google_login(code="code", redirect_uri="https://redirect.uri")


async def test_google_login_google_api_not_responding():
    settings.GITLAB_CLIENT_ID = "id"
    settings.GITLAB_CLIENT_SECRET = "secret"
    with (
        patch("taiga.integrations.google.auth.services.google_services", autospec=True) as fake_google_services,
        pytest.raises(ex.GoogleAPIError),
    ):
        fake_google_services.get_access_to_google.return_value = "access_token"
        fake_google_services.get_user_info_from_google.return_value = None
        await services.google_login(code="code", redirect_uri="https://redirect.uri")
