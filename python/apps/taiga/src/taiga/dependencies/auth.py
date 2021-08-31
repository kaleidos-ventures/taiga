# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Dict, Optional, Tuple

from fastapi import Header
from taiga.exceptions.api import AuthenticationError
from taiga.tokens import AccessToken, TokenError


def _get_authorization_scheme_token(authorization_header_value: str) -> Tuple[str, str]:
    if not authorization_header_value:
        return "", ""
    scheme, _, token = authorization_header_value.partition(" ")
    return scheme.strip().lower(), token.strip()


async def get_user_data_from_request(
    authorization: str = Header(
        "",
        title="Authorization token",
        description="The credentials (JWT) to authenticate a user.",
        example="Bearer eyJ0eXAiOiJiLCJhI1NiJ9",
    )
) -> Optional[Dict[str, str]]:
    """
    Read auth token from headers, generate and AccessToken and return user data from the token payload.
    """
    scheme, token = _get_authorization_scheme_token(authorization)
    if not token or scheme != "bearer":
        return None
    else:
        try:
            access_token = AccessToken(token)
        except TokenError:
            raise AuthenticationError()
        return access_token.user_data
