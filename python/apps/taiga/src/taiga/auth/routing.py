# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any, Union

from fastapi import Security
from fastapi.params import Depends
from fastapi.routing import APIRoute, APIRouter
from starlette.middleware import Middleware
from starlette.middleware.authentication import AuthenticationMiddleware
from taiga.base.api import MiddlewareAPIRouteWrapper
from taiga.exceptions.api.errors import ERROR_401

from . import backend as auth_backend
from .security import HTTPBearer

AuthAPIRoute: type[APIRoute] = MiddlewareAPIRouteWrapper(
    middleware=[
        Middleware(
            AuthenticationMiddleware,
            backend=auth_backend,
            on_error=auth_backend.on_auth_error,
        )
    ]
)


class AuthAPIRouter(APIRouter):
    def __init__(
        self,
        *,
        dependencies: list[Depends] = [],
        route_class: type[APIRoute] = AuthAPIRoute,
        responses: dict[Union[int, str], dict[str, Any]] = {},
        **kwargs: Any,
    ) -> None:
        super().__init__(
            dependencies=dependencies + [Security(HTTPBearer())],
            route_class=route_class,
            responses=ERROR_401 | responses,
            **kwargs,
        )
