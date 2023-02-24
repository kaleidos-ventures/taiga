# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.auth.serializers import AccessTokenWithRefreshSerializer
from taiga.auth.serializers import services as serializers_services
from taiga.auth.services import exceptions as ex
from taiga.auth.tokens import AccessToken, RefreshToken
from taiga.tokens.exceptions import TokenError
from taiga.users import repositories as users_repositories
from taiga.users.models import User


async def login(username: str, password: str) -> AccessTokenWithRefreshSerializer | None:
    user = await users_repositories.get_user(filters={"username_or_email": username, "is_active": True})

    if not user or not await users_repositories.check_password(user=user, password=password):
        return None

    return await create_auth_credentials(user=user)


async def refresh(token: str) -> AccessTokenWithRefreshSerializer | None:
    # Create a refresh token from a token code
    try:
        refresh_token = await RefreshToken.create(token)
    except TokenError:
        return None

    # Deny the current token and create a new one, using almost the same payload
    await refresh_token.denylist()
    new_refresh_token = refresh_token.regenerate()

    return serializers_services.serialize_access_token_with_refresh(
        token=str(new_refresh_token.access_token), refresh=str(new_refresh_token)
    )


async def authenticate(token: str) -> tuple[list[str], User]:
    # Create an access token from a token code
    try:
        access_token = await AccessToken.create(token)
    except TokenError:
        raise ex.BadAuthTokenError()

    # Check user authorization permissions
    if user := await users_repositories.get_user(filters={"id": access_token.object_data["id"], "is_active": True}):
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
    if not owner_id or owner_id != str(getattr(user, refresh_token.object_id_field)):
        raise ex.UnauthorizedUserError("You don't have permmission to deny this token")

    # Deny the token
    await refresh_token.denylist()


async def create_auth_credentials(user: User) -> AccessTokenWithRefreshSerializer:
    """
    This function create new auth credentiasl (an access token and a refresh token) for one user.
    It will also update the date of the user's last login.
    """
    await users_repositories.update_last_login(user=user)

    refresh_token = await RefreshToken.create_for_object(user)

    return serializers_services.serialize_access_token_with_refresh(
        token=str(refresh_token.access_token), refresh=str(refresh_token)
    )


async def get_available_user_logins(user: User) -> list[str]:
    available_social_user_logins = await users_repositories.list_auths_data(filters={"user_id": user.id})
    available_user_logins = [x.key for x in available_social_user_logins]

    if user.password:
        available_user_logins.append("password")

    return available_user_logins
