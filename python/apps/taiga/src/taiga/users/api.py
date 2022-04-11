# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.auth import services as auth_services
from taiga.auth.models import AccessWithRefreshToken
from taiga.auth.serializers import AccessTokenWithRefreshSerializer
from taiga.base.api import Request
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_400, ERROR_401, ERROR_422
from taiga.routers import routes
from taiga.users import exceptions as services_ex
from taiga.users import services as users_services
from taiga.users.models import User
from taiga.users.serializers import UserMeSerializer, UserSerializer
from taiga.users.validators import CreateUserValidator, VerifyTokenValidator


@routes.users.get(
    "/me",
    name="users.me",
    summary="Get authenticared user profile",
    response_model=UserMeSerializer,
    responses=ERROR_401,
)
async def me(request: Request) -> User:
    """
    Get the profile of the current authenticated user (according to the auth token in the request heades).
    """
    if request.user.is_anonymous:
        # NOTE: We force a 401 instead of using the permissions system (which would return a 403)
        raise ex.AuthorizationError("User is anonymous")

    return request.user


@routes.unauth_users.post(
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


@routes.unauth_users.post(
    "/verify",
    name="users.verify",
    summary="Verify the account of a new signup user",
    response_model=AccessTokenWithRefreshSerializer,
    responses=ERROR_400 | ERROR_422,
)
async def verify(form: VerifyTokenValidator) -> AccessWithRefreshToken:
    try:
        user = await users_services.verify_user(token=form.token)
        return await auth_services.create_auth_credentials(user=user)
    except services_ex.UsedVerifyUserTokenError:
        raise ex.BadRequest("The token has already been used.", detail="used_token")
    except services_ex.ExpiredVerifyUserTokenError:
        raise ex.BadRequest("The token has expired.", detail="expired_token")
    except services_ex.BadVerifyUserTokenError:
        raise ex.BadRequest("Invalid or malformed token.", detail="invalid_token")
