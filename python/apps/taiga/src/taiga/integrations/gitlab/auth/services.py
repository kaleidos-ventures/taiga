# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.auth.serializers import AccessTokenWithRefreshSerializer
from taiga.conf import settings
from taiga.integrations.auth import services as integrations_auth_services
from taiga.integrations.gitlab import exceptions as ex
from taiga.integrations.gitlab import services as gitlab_services


async def gitlab_login(code: str, redirect_uri: str, lang: str | None = None) -> AccessTokenWithRefreshSerializer:
    if not settings.GITLAB_CLIENT_ID or not settings.GITLAB_CLIENT_SECRET or not settings.GITLAB_URL:
        raise ex.GitlabLoginError("Login with Gitlab is not available. Contact with the platform administrators.")

    access_token = await gitlab_services.get_access_to_gitlab(code=code, redirect_uri=redirect_uri)
    if not access_token:
        raise ex.GitlabLoginAuthenticationError("The provided code is not valid.")

    user_info = await gitlab_services.get_user_info_from_gitlab(access_token=access_token)
    if not user_info:
        raise ex.GitlabAPIError("Gitlab API is not responding.")

    return await integrations_auth_services.social_login(
        email=user_info.email,
        full_name=user_info.full_name,
        social_key="gitlab",
        social_id=user_info.gitlab_id,
        bio=user_info.bio,
        lang=lang,
    )
