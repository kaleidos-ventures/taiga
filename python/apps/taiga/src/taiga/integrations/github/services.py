# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
from typing import Final

import httpx
from taiga.conf import settings
from taiga.integrations.github.dataclasses import GithubUserProfile

ACCESS_TOKEN_URL: Final[str] = "https://github.com/login/oauth/access_token"
EMAILS_API_URL: Final[str] = "https://api.github.com/user/emails"
USER_API_URL: Final[str] = "https://api.github.com/user"
HEADERS: Final[dict[str, str]] = {
    "Accept": "application/json",
}


async def get_access_to_github(code: str) -> str | None:
    headers = HEADERS.copy()
    params = {
        "code": code,
        "client_id": settings.GITHUB_CLIENT_ID,
        "client_secret": settings.GITHUB_CLIENT_SECRET,
        "scope": "user:emails",
    }
    async with httpx.AsyncClient() as async_client:
        response = await async_client.post(ACCESS_TOKEN_URL, params=params, headers=headers)

    data = response.json()
    if response.status_code != 200 or "error" in data:
        return None

    return data.get("access_token", None)


async def get_user_info_from_github(access_token: str) -> GithubUserProfile | None:
    headers = HEADERS.copy()
    headers["Authorization"] = f"token {access_token}"

    async with httpx.AsyncClient() as async_client:
        response_user = await async_client.get(USER_API_URL, headers=headers)
        response_emails = await async_client.get(EMAILS_API_URL, headers=headers)

    if response_user.status_code != 200 or response_emails.status_code != 200:
        return None

    user_profile = response_user.json()
    full_name = user_profile.get("name") or user_profile.get("login")

    emails = response_emails.json()
    primary_email = ""
    for e in emails:
        if e.get("primary"):
            primary_email = e["email"]
            break

    return GithubUserProfile(
        email=primary_email,
        github_id=user_profile.get("id"),
        full_name=full_name,
        bio=user_profile.get("bio"),
    )
