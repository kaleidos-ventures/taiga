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
from taiga.users import services as users_services
from taiga.users import validators as users_validators
from taiga.users.dataclasses import VerificationInfo
from taiga.users.models import User
from taiga.users.serializers import UserMeSerializer, UserSerializer, VerificationInfoSerializer
from taiga.users.validators import SearchUsersByTextValidator

# PERMISSIONS
LIST_USERS = IsAuthenticated()
GET_USERS_BY_TEXT = IsAuthenticated()


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
    Get the profile of the current authenticated user (according to the auth token in the request headers).
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
    return await users_services.create_user(
        email=form.email,
        full_name=form.full_name,
        password=form.password,
        project_invitation_token=form.project_invitation_token,
        accept_project_invitation=form.accept_project_invitation,
    )


@routes.unauth_users.post(
    "/verify",
    name="users.verify",
    summary="Verify the account of a new signup user",
    response_model=VerificationInfoSerializer,
    responses=ERROR_400 | ERROR_422,
)
async def verify_user(form: users_validators.VerifyTokenValidator) -> VerificationInfo:
    """
    Verify the account of a new signup user.
    """
    return await users_services.verify_user(token=form.token)


#####################################################################
# User Search
#####################################################################


@routes.users.post(
    "/search",
    name="users",
    summary="List all users matching a full text search, ordered (when provided) by their project closeness",
    response_model=list[UserSerializer],
)
async def get_users_by_text(request: Request, form: SearchUsersByTextValidator) -> list[User]:
    """
    List all the users matching the full-text search criteria, ordering results by their proximity to a project :
        1st. project members of this project
        2nd. members of the project's workspace / members of the project's organization (if any)
        3rd. rest of users (the priority for this group is not too important)
    """
    await check_permissions(permissions=GET_USERS_BY_TEXT, user=request.user)

    return await users_services.get_users_by_text(
        text=form.text,
        project_slug=form.project,
        excluded_usernames=form.excluded_users,
        offset=form.offset,
        limit=form.limit,
    )


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
    """
    Request a user password reset.
    """
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
    """
    Verify reset password token
    """
    return await users_services.verify_reset_password_token(token=token)


@routes.unauth_users.post(
    "/reset-password/{token}",
    name="users.reset-password-change",
    summary="Reset user password",
    response_model=AccessTokenWithRefreshSerializer,
    responses=ERROR_400 | ERROR_422,
)
async def reset_password(token: str, form: users_validators.ResetPasswordValidator) -> AccessWithRefreshToken:
    """
    Reset user password
    """
    user = await users_services.reset_password(token=token, password=form.password)

    if not user:
        raise ex.BadRequest("The user is inactive or does not exist.", detail="inactive-user")
    return await auth_services.create_auth_credentials(user=user)
