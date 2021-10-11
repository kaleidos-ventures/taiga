# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import APIRouter
from taiga.exceptions.api import AuthenticationError
from taiga.exceptions.api.errors import ERROR_401, ERROR_422

from . import services as auth_services
from .serializers import AccessTokenWithRefreshSerializer
from .validators import AccessTokenValidator, RefreshTokenValidator

metadata = {
    "name": "auth",
    "description": "Enpoints for API authentication.",
}

router = APIRouter(prefix="/auth", tags=["auth"], responses=ERROR_401)


@router.post(
    "/token",
    name="auth.token",
    summary="Get token",
    response_model=AccessTokenWithRefreshSerializer,
    responses=ERROR_422,
)
def token(form: AccessTokenValidator) -> AccessTokenWithRefreshSerializer:
    """
    Get an access and refresh token using a username and a password.
    """
    data = auth_services.login(form.username, form.password)
    if not data:
        raise AuthenticationError()
    return AccessTokenWithRefreshSerializer(token=data.token, refresh=data.refresh)


@router.post(
    "/token/refresh",
    name="auth.token.refresh",
    summary="Refresh token",
    response_model=AccessTokenWithRefreshSerializer,
    responses=ERROR_422,
)
def refresh(form: RefreshTokenValidator) -> AccessTokenWithRefreshSerializer:
    """
    Get an access and refresh token using a refresh token.
    """
    data = auth_services.refresh(form.refresh)
    if not data:
        raise AuthenticationError()
    return AccessTokenWithRefreshSerializer(token=data.token, refresh=data.refresh)
