# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.auth.serializers import AccessTokenWithRefreshSerializer
from taiga.base.api import responses
from taiga.exceptions.api.errors import ERROR_400, ERROR_422
from taiga.integrations.gitlab.auth import services as auth_gitlab_services
from taiga.integrations.gitlab.auth.validators import GitlabLoginValidator
from taiga.routers import routes

# HTTP 200 RESPONSES
ACCESS_TOKEN_200 = responses.http_status_200(model=AccessTokenWithRefreshSerializer)


@routes.unauth.post(
    "/gitlab",
    name="auth.gitlab",
    summary="Login / register with Gitlab",
    responses=ACCESS_TOKEN_200 | ERROR_400 | ERROR_422,
)
async def gitlab_login(form: GitlabLoginValidator) -> AccessTokenWithRefreshSerializer:
    """
    Get an access and refresh token using a Gitlab authorization.
    For a non-existing user, this process registers a new user as well.
    """
    return await auth_gitlab_services.gitlab_login(code=form.code, redirect_uri=form.redirect_uri, lang=form.lang)
