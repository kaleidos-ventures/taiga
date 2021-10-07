# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Tuple, Union

from fastapi import Request
from starlette.authentication import AuthCredentials
from taiga.exceptions.api import AuthenticationError
from taiga.exceptions.services.auth import BadAuthTokenError, UnauthorizedUserError
from taiga.models.users import AnonymousUser, User
from taiga.services import auth as auth_serv

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
