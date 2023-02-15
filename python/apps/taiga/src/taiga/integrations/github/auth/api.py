# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.auth.serializers import AccessTokenWithRefreshSerializer
from taiga.base.api import responses
from taiga.exceptions.api.errors import ERROR_400, ERROR_422
from taiga.integrations.github.auth import services as auth_github_services
from taiga.integrations.github.auth.validators import GithubLoginValidator
from taiga.routers import routes

# HTTP 200 RESPONSES
ACCESS_TOKEN_200 = responses.http_status_200(model=AccessTokenWithRefreshSerializer)


@routes.unauth.post(
    "/github",
    name="auth.github",
    summary="Login / register with Github",
    responses=ACCESS_TOKEN_200 | ERROR_400 | ERROR_422,
)
async def github_login(form: GithubLoginValidator) -> AccessTokenWithRefreshSerializer:
    """
    Get an access and refresh token using a Github authorization.
    For a non-existing user, this process registers a new user as well.
    """
    return await auth_github_services.github_login(code=form.code, lang=form.lang)
