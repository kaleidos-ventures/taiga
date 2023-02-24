# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from fastapi import Request
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.security import HTTPBearer as HTTPBearerBase
from taiga.exceptions.api import AuthorizationError


class HTTPBearer(HTTPBearerBase):
    def _get_authorization_scheme_token(self, authorization_header_value: str) -> tuple[str, str]:
        if not authorization_header_value:
            return "", ""
        scheme, _, token = authorization_header_value.partition(" ")
        return scheme.strip().lower(), token.strip()

    async def __call__(self, request: Request) -> HTTPAuthorizationCredentials | None:
        authorization = request.headers.get("Authorization", "")
        scheme, credentials = self._get_authorization_scheme_token(authorization)
        if not (authorization and scheme and credentials):
            return None
        elif scheme != "bearer":
            if self.auto_error:
                raise AuthorizationError(
                    msg="Invalid authentication credentials scheme",
                )
            else:
                return None
        return HTTPAuthorizationCredentials(scheme=scheme, credentials=credentials)
