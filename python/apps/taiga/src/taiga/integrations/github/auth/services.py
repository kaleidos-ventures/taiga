# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.auth.schemas import AccessWithRefreshTokenSchema
from taiga.conf import settings
from taiga.integrations.auth import services as integrations_auth_services
from taiga.integrations.github import exceptions as ex
from taiga.integrations.github import services as github_services


async def github_login(code: str, lang: str | None = None) -> AccessWithRefreshTokenSchema:
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        raise ex.GithubLoginError("Login with Github is not available. Contact with the platform administrators.")

    access_token = await github_services.get_access_to_github(code=code)
    if not access_token:
        raise ex.GithubLoginAuthenticationError("The provided code is not valid.")

    user_info = await github_services.get_user_info_from_github(access_token=access_token)
    if not user_info:
        raise ex.GithubAPIError("Github API is not responding.")

    return await integrations_auth_services.social_login(
        email=user_info.email,
        full_name=user_info.full_name,
        social_key="github",
        social_id=user_info.github_id,
        bio=user_info.bio,
        lang=lang,
    )
