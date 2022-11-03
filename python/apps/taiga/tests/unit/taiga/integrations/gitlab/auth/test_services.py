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
from taiga.integrations.gitlab.schemas import GitlabUserProfileSchema

##########################################################
# gitlab_login
##########################################################


async def test_gitlab_login_ok():
    settings.GITLAB_CLIENT_ID = "id"
    settings.GITLAB_CLIENT_SECRET = "secret"
    settings.GITLAB_URL = "https://gitlab.com"
    with (
        patch("taiga.integrations.gitlab.auth.services.gitlab_services", autospec=True) as fake_gitlab_services,
        patch(
            "taiga.integrations.gitlab.auth.services.integrations_auth_services", autospec=True
        ) as fake_integrations_auth_services,
    ):
        fake_gitlab_services.get_access_to_gitlab.return_value = "access_token"
        fake_gitlab_services.get_user_info_from_gitlab.return_value = GitlabUserProfileSchema(
            email="email@test.com", full_name="Full Name", gitlab_id="1", bio="Bio"
        )
        await services.gitlab_login(code="code", redirect_uri="https://redirect.uri", lang="es_ES")
        fake_integrations_auth_services.social_login.assert_awaited_once()


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
