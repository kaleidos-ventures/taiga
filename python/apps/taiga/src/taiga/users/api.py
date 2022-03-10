# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import APIRouter
from taiga.auth.routing import AuthAPIRouter
from taiga.base.api import Request
from taiga.exceptions import api as ex
from taiga.exceptions import services as services_ex
from taiga.exceptions.api.errors import ERROR_400, ERROR_422
from taiga.users import services as users_services
from taiga.users.models import User
from taiga.users.serializers import UserMeSerializer, UserSerializer
from taiga.users.validators import CreateUserValidator

metadata = {
    "name": "users",
    "description": "Endpoint for users resources.",
}

router = AuthAPIRouter(prefix="/users", tags=["users"])
unauthorized_router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", name="users.me", summary="Get authenticared user profile", response_model=UserMeSerializer)
def me(request: Request) -> User:
    """
    Get the profile of the current authenticated user (according to the auth token in the request heades).
    """
    if request.user.is_anonymous:
        raise ex.AuthorizationError("User is anonymous")

    return request.user


@unauthorized_router.post(
    "",
    name="users.create",
    summary="Sign up user",
    response_model=UserSerializer,
    responses=ERROR_400 | ERROR_422,
)
async def create_user(form: CreateUserValidator) -> User:
    """
    Create new user, which is not yet verified.
    """
    try:
        return await users_services.create_user(email=form.email, full_name=form.full_name, password=form.password)
    except services_ex.EmailAlreadyExistsError:
        raise ex.BadRequest("Email already exists")
