# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.auth.routing import AuthAPIRouter
from taiga.base.api import Request
from taiga.exceptions import api as ex
from taiga.users.serializers import UserMeSerializer

metadata = {
    "name": "users",
    "description": "Endpoint for users resources.",
}

router = AuthAPIRouter(prefix="/users", tags=["users"])


@router.get("/me", name="users.me", summary="Get authenticared user profile", response_model=UserMeSerializer)
def me(request: Request) -> UserMeSerializer:
    """
    Get the profile of the current authenticated user (according to the auth token in the request heades).
    """
    if request.user.is_anonymous:
        raise ex.AuthorizationError()

    return UserMeSerializer.from_orm(request.user)
