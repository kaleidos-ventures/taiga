# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import List, Optional, Tuple

from taiga.exceptions.services.auth import BadAuthTokenError, UnauthorizedUserError
from taiga.models.auth import AccessWithRefreshToken
from taiga.models.users import User
from taiga.repositories import users as users_repo
from taiga.tokens import TokenError
from taiga.tokens.auth import AccessToken, RefreshToken


def login(username: str, password: str) -> Optional[AccessWithRefreshToken]:
    user = users_repo.get_user_by_username_or_email(username)

    if not user or not user.check_password(password) or not user.is_active or user.is_system:
        return None

    users_repo.update_last_login(user)

    refresh_token = RefreshToken.for_user(user)

    return AccessWithRefreshToken(token=str(refresh_token.access_token), refresh=str(refresh_token))


def refresh(token: str) -> Optional[AccessWithRefreshToken]:
    try:
        refresh_token = RefreshToken(token)
    except TokenError:
        return None

    refresh_token.denylist()
    refresh_token.set_jti()
    refresh_token.set_exp()

    return AccessWithRefreshToken(token=str(refresh_token.access_token), refresh=str(refresh_token))


def authenticate(token: str) -> Tuple[List[str], User]:
    # Getnerate Access token
    try:
        access_token = AccessToken(token)
    except TokenError:
        raise BadAuthTokenError()

    # Check user authorization permissions
    user_data = access_token.user_data
    if user_data and (user := users_repo.get_first_user(**user_data, is_active=True, is_system=False)):
        return ["auth"], user

    raise UnauthorizedUserError()
