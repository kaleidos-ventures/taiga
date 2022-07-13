# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Final

import httpx
from taiga.conf import settings
from taiga.integrations.google.dataclasses import GoogleUserProfile

HEADERS: Final[dict[str, str]] = {
    "Accept": "application/json",
}
ACCESS_TOKEN_URL: Final[str] = "https://oauth2.googleapis.com/token"
USER_API_URL: Final[str] = "https://openidconnect.googleapis.com/v1/userinfo"


async def get_access_to_google(code: str, redirect_uri: str) -> str | None:
    headers = HEADERS.copy()
    headers["Content-Type"] = "application/x-www-form-urlencoded"

    params = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "grant_type": "authorization_code",
        "redirect_uri": redirect_uri,
    }

    async with httpx.AsyncClient() as async_client:
        response = await async_client.post(
            ACCESS_TOKEN_URL,
            headers=headers,
            data=params,
            auth=(settings.GOOGLE_CLIENT_ID, settings.GOOGLE_CLIENT_SECRET),  # type: ignore
        )

    data = response.json()
    if response.status_code != 200 or "error" in data:
        return None

    return data.get("access_token", None)


async def get_user_info_from_google(access_token: str) -> GoogleUserProfile | None:
    headers = HEADERS.copy()
    headers["Authorization"] = f"Bearer {access_token}"

    async with httpx.AsyncClient() as async_client:
        response_user = await async_client.get(USER_API_URL, headers=headers)

    if response_user.status_code != 200:
        return None

    user_profile = response_user.json()

    return GoogleUserProfile(
        email=user_profile.get("email"),
        google_id=user_profile.get("sub"),
        full_name=user_profile.get("name"),
        bio=user_profile.get("hd"),
    )
