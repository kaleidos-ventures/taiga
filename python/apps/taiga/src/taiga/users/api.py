# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.auth import services as auth_services
from taiga.auth.dataclasses import AccessWithRefreshToken
from taiga.auth.serializers import AccessTokenWithRefreshSerializer
from taiga.base.api import Request
from taiga.base.api.permissions import check_permissions
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_400, ERROR_401, ERROR_422
from taiga.permissions import IsAuthenticated
from taiga.routers import routes
from taiga.users import exceptions as services_ex
from taiga.users import services as users_services
from taiga.users import validators as users_validators
from taiga.users.dataclasses import VerificationInfo
from taiga.users.models import User
from taiga.users.serializers import UserContactSerializer, UserMeSerializer, UserSerializer, VerificationInfoSerializer

# PERMISSIONS
GET_MY_CONTACTS = IsAuthenticated()


#####################################################################
# User Profile
#####################################################################


@routes.users.get(
    "/me",
    name="users.me",
    summary="Get authenticated user profile",
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
async def create_user(form: users_validators.CreateUserValidator) -> User:
    """
    Create new user, which is not yet verified.
    """
    try:
        return await users_services.create_user(
            email=form.email,
            full_name=form.full_name,
            password=form.password,
            project_invitation_token=form.project_invitation_token,
            accept_project_invitation=form.accept_project_invitation,
        )
    except services_ex.EmailAlreadyExistsError:
        raise ex.BadRequest("Email already exists")


@routes.unauth_users.post(
    "/verify",
    name="users.verify",
    summary="Verify the account of a new signup user",
    response_model=VerificationInfoSerializer,
    responses=ERROR_400 | ERROR_422,
)
async def verify_user(form: users_validators.VerifyTokenValidator) -> VerificationInfo:
    try:
        return await users_services.verify_user(token=form.token)
    except services_ex.UsedVerifyUserTokenError:
        raise ex.BadRequest("The token has already been used.", detail="used_token")
    except services_ex.ExpiredVerifyUserTokenError:
        raise ex.BadRequest("The token has expired.", detail="expired_token")
    except services_ex.BadVerifyUserTokenError:
        raise ex.BadRequest("Invalid or malformed token.", detail="invalid_token")


#####################################################################
# Reset Password
#####################################################################


@routes.unauth_users.post(
    "/reset-password",
    name="users.reset-password-request",
    summary="Request a user password reset",
    response_model=bool,
    responses=ERROR_422,
)
async def request_reset_password(form: users_validators.RequestResetPasswordValidator) -> bool:
    await users_services.request_reset_password(email=form.email)
    return True


@routes.unauth_users.get(
    "/reset-password/{token}/verify",
    name="users.reset-password-verify",
    summary="Verify reset password token",
    response_model=bool,
    responses=ERROR_400 | ERROR_422,
)
async def verify_reset_password_token(token: str) -> bool:
    try:
        return await users_services.verify_reset_password_token(token=token)
    except services_ex.BadResetPasswordTokenError:
        raise ex.BadRequest("Invalid or malformed token.", detail="invalid_token")
    except services_ex.UsedResetPasswordTokenError:
        raise ex.BadRequest("The token has already been used.", detail="used_token")
    except services_ex.ExpiredResetPassswordTokenError:
        raise ex.BadRequest("The token has expired.", detail="expired_token")


@routes.unauth_users.post(
    "/reset-password/{token}",
    name="users.reset-password-change",
    summary="Reset user password",
    response_model=AccessTokenWithRefreshSerializer,
    responses=ERROR_400 | ERROR_422,
)
async def reset_password(token: str, form: users_validators.ResetPasswordValidator) -> AccessWithRefreshToken:
    try:
        user = await users_services.reset_password(token=token, password=form.password)

        if not user:
            raise ex.BadRequest("The user is inactive or does not exist.", detail="inactive_user")

        return await auth_services.create_auth_credentials(user=user)

    except services_ex.BadResetPasswordTokenError:
        raise ex.BadRequest("Invalid or malformed token.", detail="invalid_token")
    except services_ex.UsedResetPasswordTokenError:
        raise ex.BadRequest("The token has already been used.", detail="used_token")
    except services_ex.ExpiredResetPassswordTokenError:
        raise ex.BadRequest("The token has expired.", detail="expired_token")


#####################################################################
# Contact
#####################################################################


@routes.my.post(
    "/contacts",
    name="my.contacts",
    summary="List my known contacts",
    response_model=list[UserContactSerializer],
)
async def list_my_contacts(request: Request, form: users_validators.UserContactsValidator) -> list[User]:
    """
    List the visible contacts the logged user knows.
    """
    # This endpoint should be a GET but it's a POST because of the following:
    # - it receives lots of data that potentially could exceed the max limit of the URL length
    # - so we decided to use the body of the request (with GET)
    # - however, Angular cannot process the body in a GET request
    # - thus we are using the POST verb here
    await check_permissions(permissions=GET_MY_CONTACTS, user=request.user)

    return await users_services.list_user_contacts(user=request.user, emails=form.emails)
