# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Dict, Optional, Tuple

from fastapi import Security
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.security import HTTPBearer as HTTPBearerBase
from starlette.requests import Request
from taiga.exceptions.api import AuthenticationError
from taiga.tokens import AccessToken, TokenError


class HTTPBearer(HTTPBearerBase):
    def _get_authorization_scheme_token(self, authorization_header_value: str) -> Tuple[str, str]:
        if not authorization_header_value:
            return "", ""
        scheme, _, token = authorization_header_value.partition(" ")
        return scheme.strip().lower(), token.strip()

    async def __call__(self, request: Request) -> Optional[HTTPAuthorizationCredentials]:
        authorization: str = request.headers.get("Authorization")
        scheme, credentials = self._get_authorization_scheme_token(authorization)
        if not (authorization and scheme and credentials):
            return None
        elif scheme != "bearer":
            if self.auto_error:
                raise AuthenticationError(
                    detail="Invalid authentication credentials",
                )
        return HTTPAuthorizationCredentials(scheme=scheme, credentials=credentials)


security = HTTPBearer()


async def get_user_data_from_request(
    authorization: Optional[HTTPAuthorizationCredentials] = Security(security),
) -> Optional[Dict[str, str]]:
    """
    Read auth token from headers, generate and AccessToken and return user data from the token payload.
    """
    if not authorization:
        return None
    else:
        try:
            access_token = AccessToken(authorization.credentials)
        except TokenError:
            raise AuthenticationError(
                detail="Invalid authentication token",
            )
        return access_token.user_data
