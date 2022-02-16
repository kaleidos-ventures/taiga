# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.auth.exceptions import BadAuthTokenError, UnauthorizedUserError
from taiga.tokens import TokenError
from taiga.users import repositories as users_repositories
from taiga.users.models import User

from .models import AccessWithRefreshToken
from .tokens import AccessToken, RefreshToken


async def login(username: str, password: str) -> AccessWithRefreshToken | None:
    user = await users_repositories.get_user_by_username_or_email(username_or_email=username)

    if (
        not user
        or not await users_repositories.check_password(user=user, password=password)
        or not user.is_active
        or user.is_system
    ):
        return None

    await users_repositories.update_last_login(user=user)

    refresh_token = await RefreshToken.create_for_user(user)

    return AccessWithRefreshToken(token=str(refresh_token.access_token), refresh=str(refresh_token))


async def refresh(token: str) -> AccessWithRefreshToken | None:
    try:
        refresh_token = await RefreshToken.create(token)
    except TokenError:
        return None

    await refresh_token.denylist()
    refresh_token.set_jti()
    refresh_token.set_exp()

    return AccessWithRefreshToken(token=str(refresh_token.access_token), refresh=str(refresh_token))


async def authenticate(token: str) -> tuple[list[str], User]:
    # Getnerate Access token
    try:
        access_token = await AccessToken.create(token)
    except TokenError:
        raise BadAuthTokenError()

    # Check user authorization permissions
    if user_data := access_token.user_data:
        if user := await users_repositories.get_first_user(**user_data, is_active=True, is_system=False):
            return ["auth"], user

    raise UnauthorizedUserError()
