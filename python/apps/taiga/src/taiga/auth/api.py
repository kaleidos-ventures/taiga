# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import APIRouter, Response, status
from taiga.auth import exceptions as services_ex
from taiga.auth import services as auth_services
from taiga.auth.routing import AuthAPIRouter
from taiga.auth.serializers import AccessTokenWithRefreshSerializer
from taiga.auth.validators import AccessTokenValidator, RefreshTokenValidator
from taiga.base.api import Request
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_400, ERROR_401, ERROR_403, ERROR_422

metadata = {
    "name": "auth",
    "description": "Enpoints for API authentication.",
}

router = AuthAPIRouter(prefix="/auth", tags=["auth"])
unauthorized_router = APIRouter(prefix="/auth", tags=["auth"], responses=ERROR_401)


@unauthorized_router.post(
    "/token",
    name="auth.token",
    summary="Get token",
    response_model=AccessTokenWithRefreshSerializer,
    responses=ERROR_422,
)
async def token(form: AccessTokenValidator) -> AccessTokenWithRefreshSerializer:
    """
    Get an access and refresh token using a username and a password.
    """
    data = await auth_services.login(username=form.username, password=form.password)
    if not data:
        raise ex.AuthorizationError()
    return AccessTokenWithRefreshSerializer(token=data.token, refresh=data.refresh)


@unauthorized_router.post(
    "/token/refresh",
    name="auth.token.refresh",
    summary="Refresh token",
    response_model=AccessTokenWithRefreshSerializer,
    responses=ERROR_422,
)
async def refresh(form: RefreshTokenValidator) -> AccessTokenWithRefreshSerializer:
    """
    Get an access and refresh token using a refresh token.
    """
    data = await auth_services.refresh(token=form.refresh)
    if not data:
        raise ex.AuthorizationError()
    return AccessTokenWithRefreshSerializer(token=data.token, refresh=data.refresh)


@router.post(
    "/token/deny",
    name="auth.token.denu",
    summary="Deny a refresh token",
    responses=ERROR_422 | ERROR_400 | ERROR_403,
    response_class=Response,
    status_code=status.HTTP_204_NO_CONTENT,
)
async def deny(form: RefreshTokenValidator, request: Request) -> None:
    """
    Deny a refresh token.
    """
    if request.user.is_anonymous:
        # NOTE: We force a 401 instead of using the permissions system (which would return a 403)
        raise ex.AuthorizationError("User is anonymous")

    try:
        await auth_services.deny_refresh_token(user=request.user, token=form.refresh)
    except services_ex.BadRefreshTokenError:
        raise ex.BadRequest("Invalid token")
    except services_ex.UnauthorizedUserError:
        raise ex.ForbiddenError("You don't have permmission to deny this token")
