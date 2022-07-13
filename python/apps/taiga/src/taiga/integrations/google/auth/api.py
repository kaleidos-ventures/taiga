# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.auth.dataclasses import AccessWithRefreshToken
from taiga.auth.serializers import AccessTokenWithRefreshSerializer
from taiga.exceptions.api.errors import ERROR_400, ERROR_422
from taiga.integrations.google.auth import services as auth_google_services
from taiga.integrations.google.auth.validators import GoogleLoginValidator
from taiga.routers import routes


@routes.unauth.post(
    "/google",
    name="auth.google",
    summary="Login / register with Google",
    response_model=AccessTokenWithRefreshSerializer,
    responses=ERROR_400 | ERROR_422,
)
async def google_login(form: GoogleLoginValidator) -> AccessWithRefreshToken:
    """
    Get an access and refresh token using a Google authorization.
    For a non-existing user, this process registers a new user as well.
    """
    return await auth_google_services.google_login(code=form.code, redirect_uri=form.redirect_uri)
