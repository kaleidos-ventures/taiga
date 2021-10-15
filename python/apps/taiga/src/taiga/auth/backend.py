# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Tuple, Union

from fastapi import Request, Response, status
from starlette.authentication import AuthCredentials, AuthenticationError
from starlette.responses import JSONResponse
from taiga.auth.exceptions import BadAuthTokenError, UnauthorizedUserError
from taiga.exceptions.api import codes
from taiga.users.models import AnonymousUser, User

from . import services as auth_serv
from .security import HTTPBearer

security = HTTPBearer()


async def authenticate(request: Request) -> Tuple[AuthCredentials, Union[AnonymousUser, User]]:
    authorization = await security(request)

    if authorization:
        try:
            scope, user = auth_serv.authenticate(authorization.credentials)
            return AuthCredentials(scope), user
        except (BadAuthTokenError, UnauthorizedUserError):
            raise AuthenticationError()
    else:
        return AuthCredentials([]), AnonymousUser()


def on_auth_error(request: Request, exc: Exception) -> Response:
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={
            "error": {
                "code": codes.EX_AUTHENTICATION.code,
                "message": codes.EX_AUTHENTICATION.message,
            }
        },
        headers={"WWW-Authenticate": 'Bearer realm="api"'},
    )
