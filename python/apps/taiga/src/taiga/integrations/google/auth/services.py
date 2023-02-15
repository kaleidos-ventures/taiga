# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.auth.serializers import AccessTokenWithRefreshSerializer
from taiga.conf import settings
from taiga.integrations.auth import services as integrations_auth_services
from taiga.integrations.google import exceptions as ex
from taiga.integrations.google import services as google_services


async def google_login(code: str, redirect_uri: str, lang: str | None = None) -> AccessTokenWithRefreshSerializer:
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise ex.GoogleLoginError("Login with Google is not available. Contact with the platform administrators.")

    access_token = await google_services.get_access_to_google(code=code, redirect_uri=redirect_uri)
    if not access_token:
        raise ex.GoogleLoginAuthenticationError("The provided code is not valid.")

    user_info = await google_services.get_user_info_from_google(access_token=access_token)
    if not user_info:
        raise ex.GoogleAPIError("Google API is not responding.")

    return await integrations_auth_services.social_login(
        email=user_info.email,
        full_name=user_info.full_name,
        social_key="google",
        social_id=user_info.google_id,
        bio=user_info.bio,
        lang=lang,
    )
