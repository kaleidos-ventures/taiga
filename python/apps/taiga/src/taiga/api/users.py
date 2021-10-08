# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import APIRouter, Depends
from taiga.dependencies.users import get_current_user
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_401
from taiga.models.users import User
from taiga.serializers.users import UserMeSerializer

metadata = {
    "name": "users",
    "description": "Endpoint for users resources.",
}

router = APIRouter(prefix="/users", tags=["users"], responses=ERROR_401)


@router.get("/me", name="users.me", summary="Get authenticared user profile", response_model=UserMeSerializer)
def me(user: User = Depends(get_current_user)) -> UserMeSerializer:
    """
    Get the profile of the current authenticated user (according to the auth token in the request heades).
    """
    if user.is_anonymous:
        raise ex.AuthenticationError()

    return UserMeSerializer.from_orm(user)
