# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.auth import exceptions as ex
from taiga.auth.dataclasses import AccessWithRefreshToken
from taiga.auth.tokens import AccessToken, RefreshToken
from taiga.tokens import TokenError
from taiga.users import repositories as users_repositories
from taiga.users.models import User


async def login(username: str, password: str) -> AccessWithRefreshToken | None:
    user = await users_repositories.get_user_by_username_or_email(username_or_email=username)

    if (
        not user
        or not await users_repositories.check_password(user=user, password=password)
        or not user.is_active
        or user.is_system
    ):
        return None

    return await create_auth_credentials(user=user)


async def refresh(token: str) -> AccessWithRefreshToken | None:
    # Create a refresh token from a token code
    try:
        refresh_token = await RefreshToken.create(token)
    except TokenError:
        return None

    # Deny the current token and create a new one, using almost the same payload
    await refresh_token.denylist()
    new_refresh_token = refresh_token.regenerate()

    return AccessWithRefreshToken(token=str(new_refresh_token.access_token), refresh=str(new_refresh_token))


async def authenticate(token: str) -> tuple[list[str], User]:
    # Create an access token from a token code
    try:
        access_token = await AccessToken.create(token)
    except TokenError:
        raise ex.BadAuthTokenError()

    # Check user authorization permissions
    if user := await users_repositories.get_first_user(**access_token.object_data, is_active=True, is_system=False):
        return ["auth"], user

    raise ex.UnauthorizedUserError("Error authenticating the user")


async def deny_refresh_token(user: User, token: str) -> None:
    # Create a refresh token from a token code
    try:
        refresh_token = await RefreshToken.create(token)
    except TokenError:
        raise ex.BadRefreshTokenError("Invalid token")

    # Check if the user who wants to deny the token is the owner (stored in the token).
    owner_id = refresh_token.object_data.get(refresh_token.object_id_field, None)
    if not owner_id or owner_id != getattr(user, refresh_token.object_id_field):
        raise ex.UnauthorizedUserError("You don't have permmission to deny this token")

    # Deny the token
    await refresh_token.denylist()


async def create_auth_credentials(user: User) -> AccessWithRefreshToken:
    """
    This function create new auth credentiasl (an access token and a refresh token) for one user.
    It will also update the date of the user's last login.
    """
    await users_repositories.update_last_login(user=user)

    refresh_token = await RefreshToken.create_for_object(user)

    return AccessWithRefreshToken(token=str(refresh_token.access_token), refresh=str(refresh_token))
