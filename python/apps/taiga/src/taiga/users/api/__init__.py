# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from fastapi import Depends, Query, Response
from taiga.auth import services as auth_services
from taiga.auth.serializers import AccessTokenWithRefreshSerializer
from taiga.base.api import Request
from taiga.base.api import pagination as api_pagination
from taiga.base.api import responses
from taiga.base.api.pagination import PaginationQuery
from taiga.base.api.permissions import check_permissions
from taiga.base.validators import B64UUID
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_400, ERROR_401, ERROR_422
from taiga.permissions import IsAuthenticated
from taiga.routers import routes
from taiga.users import services as users_services
from taiga.users.api.validators import (
    CreateUserValidator,
    RequestResetPasswordValidator,
    ResetPasswordValidator,
    UpdateUserValidator,
    VerifyTokenValidator,
)
from taiga.users.models import User
from taiga.users.serializers import UserSearchSerializer, UserSerializer, VerificationInfoSerializer

# PERMISSIONS
LIST_USERS_BY_TEXT = IsAuthenticated()


# HTTP 200 RESPONSES
ACCESS_TOKEN_200 = responses.http_status_200(model=AccessTokenWithRefreshSerializer)
VERIFICATION_INFO_200 = responses.http_status_200(model=VerificationInfoSerializer)


#####################################################################
# create user
#####################################################################


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
    return await users_services.create_user(
        email=form.email,
        full_name=form.full_name,
        color=form.color,
        password=form.password,
        lang=form.lang,
        project_invitation_token=form.project_invitation_token,
        accept_project_invitation=form.accept_project_invitation,
    )


#####################################################################
# create user verify
#####################################################################


@routes.unauth_users.post(
    "/verify",
    name="users.verify",
    summary="Verify the account of a new signup user",
    responses=VERIFICATION_INFO_200 | ERROR_400 | ERROR_422,
)
async def verify_user(form: VerifyTokenValidator) -> VerificationInfoSerializer:
    """
    Verify the account of a new signup user.
    """
    return await users_services.verify_user_from_token(token=form.token)


#####################################################################
# list users (search)
#####################################################################


@routes.users.get(
    "/search",
    name="users.search",
    summary="List all users matching a full text search, ordered (when provided) by their closeness"
    " to a project or a workspace.",
    response_model=list[UserSearchSerializer],
)
async def list_users_by_text(
    request: Request,
    response: Response,
    pagination_params: PaginationQuery = Depends(),
    text: str = Query(None, description="search text (str)"),
    project: B64UUID = Query(None, description="the project id (B64UUID)"),
    workspace: B64UUID = Query(None, description="the workspace id (B64UUID)"),
) -> list[User]:
    """
    List all the users matching the full-text search criteria in their usernames and/or full names. The response will be
    ***alphabetically ordered in blocks***, according to their proximity to a *<project/workspace>* when any of
    these two parameters are received:
      - 1st ordering block: *<project / workspace>* members,
      - 2nd ordering block: *<members of the project's workspace / members of the workspace's projects>*
      - 3rd ordering block: rest of the users
    """
    await check_permissions(permissions=LIST_USERS_BY_TEXT, user=request.user)

    pagination, users = await users_services.list_paginated_users_by_text(
        text=text,
        project_id=project,
        workspace_id=workspace,
        offset=pagination_params.offset,
        limit=pagination_params.limit,
    )

    api_pagination.set_pagination(response=response, pagination=pagination)

    return users


#####################################################################
# get user
#####################################################################


@routes.my.get(
    "/my/user",
    name="my.user",
    summary="Get authenticated user",
    response_model=UserSerializer,
    responses=ERROR_401,
)
async def get_my_user(request: Request) -> User:
    """
    Get the current authenticated user (according to the auth token in the request headers).
    """
    if request.user.is_anonymous:
        # NOTE: We force a 401 instead of using the permissions system (which would return a 403)
        raise ex.AuthorizationError("User is anonymous")

    return request.user


#####################################################################
# update user
#####################################################################


@routes.my.put(
    "/my/user",
    name="my.user.update",
    summary="Update authenticated user",
    response_model=UserSerializer,
    responses=ERROR_401 | ERROR_400 | ERROR_422,
)
async def update_my_user(request: Request, form: UpdateUserValidator) -> User:
    """
    Update the current authenticated user (according to the auth token in the request headers).
    """
    if request.user.is_anonymous:
        # NOTE: We force a 401 instead of using the permissions system (which would return a 403)
        raise ex.AuthorizationError("User is anonymous")

    return await users_services.update_user(
        user=request.user,
        full_name=form.full_name,
        lang=form.lang,
    )


#####################################################################
# reset user password
#####################################################################


@routes.unauth_users.post(
    "/reset-password",
    name="users.reset-password-request",
    summary="Request a user password reset",
    response_model=bool,
    responses=ERROR_422,
)
async def request_reset_password(form: RequestResetPasswordValidator) -> bool:
    """
    Request a user password reset.
    """
    await users_services.request_reset_password(email=form.email)
    return True


#####################################################################
# reset user password verify
#####################################################################


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
    responses=ACCESS_TOKEN_200 | ERROR_400 | ERROR_422,
)
async def reset_password(
    token: str,
    form: ResetPasswordValidator,
) -> AccessTokenWithRefreshSerializer:
    """
    Reset user password
    """
    user = await users_services.reset_password(token=token, password=form.password)

    if not user:
        raise ex.BadRequest("The user is inactive or does not exist.", detail="inactive-user")
    return await auth_services.create_auth_credentials(user=user)
