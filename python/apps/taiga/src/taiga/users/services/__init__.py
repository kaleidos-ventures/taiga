# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from uuid import UUID

from taiga.auth import services as auth_services
from taiga.base.api.pagination import Pagination
from taiga.base.utils.colors import generate_random_color
from taiga.base.utils.datetime import aware_utcnow
from taiga.conf import settings
from taiga.emails.emails import Emails
from taiga.emails.tasks import send_email
from taiga.projects.invitations import services as project_invitations_services
from taiga.projects.invitations.models import ProjectInvitation
from taiga.projects.invitations.services import exceptions as invitations_ex
from taiga.projects.projects.models import Project
from taiga.tokens import exceptions as tokens_ex
from taiga.users import repositories as users_repositories
from taiga.users.models import User
from taiga.users.serializers import VerificationInfoSerializer
from taiga.users.serializers import services as serializers_services
from taiga.users.services import exceptions as ex
from taiga.users.tokens import ResetPasswordToken, VerifyUserToken
from taiga.workspaces.invitations import services as workspace_invitations_services
from taiga.workspaces.invitations.models import WorkspaceInvitation

#####################################################################
# create user
#####################################################################


async def create_user(
    email: str,
    full_name: str,
    password: str,
    lang: str | None = None,
    color: int | None = None,
    project_invitation_token: str | None = None,
    accept_project_invitation: bool = True,
    workspace_invitation_token: str | None = None,
    accept_workspace_invitation: bool = True,
) -> User:
    user = await users_repositories.get_user(filters={"username_or_email": email})

    if user and user.is_active:
        raise ex.EmailAlreadyExistsError("Email already exists")

    lang = lang if lang else settings.LANG
    if not user:
        # new user
        if not color:
            color = generate_random_color()
        user = await users_repositories.create_user(
            email=email, full_name=full_name, color=color, password=password, lang=lang
        )
    else:
        # the user (is_active=False) tries to sign-up again before verifying the previous attempt
        user.full_name = full_name
        user.lang = lang
        user.set_password(password)
        await users_repositories.update_user(user=user)

    await _send_verify_user_email(
        user=user,
        project_invitation_token=project_invitation_token,
        accept_project_invitation=accept_project_invitation,
        workspace_invitation_token=workspace_invitation_token,
        accept_workspace_invitation=accept_workspace_invitation,
    )

    return user


#####################################################################
# verify user
#####################################################################


async def _send_verify_user_email(
    user: User,
    project_invitation_token: str | None = None,
    accept_project_invitation: bool = True,
    workspace_invitation_token: str | None = None,
    accept_workspace_invitation: bool = True,
) -> None:
    context = {
        "verification_token": await _generate_verify_user_token(
            user=user,
            project_invitation_token=project_invitation_token,
            accept_project_invitation=accept_project_invitation,
            workspace_invitation_token=workspace_invitation_token,
            accept_workspace_invitation=accept_workspace_invitation,
        )
    }

    await send_email.defer(email_name=Emails.SIGN_UP.value, to=user.email, context=context, lang=user.lang)


async def _generate_verify_user_token(
    user: User,
    project_invitation_token: str | None = None,
    accept_project_invitation: bool = True,
    workspace_invitation_token: str | None = None,
    accept_workspace_invitation: bool = True,
) -> str:
    verify_user_token = await VerifyUserToken.create_for_object(user)
    if project_invitation_token:
        verify_user_token["project_invitation_token"] = project_invitation_token
        if accept_project_invitation:
            verify_user_token["accept_project_invitation"] = accept_project_invitation

    elif workspace_invitation_token:
        verify_user_token["workspace_invitation_token"] = workspace_invitation_token
        if accept_workspace_invitation:
            verify_user_token["accept_workspace_invitation"] = accept_workspace_invitation

    return str(verify_user_token)


async def verify_user(user: User) -> None:
    await users_repositories.update_user(user=user, values={"is_active": True, "date_verification": aware_utcnow()})


async def verify_user_from_token(token: str) -> VerificationInfoSerializer:
    # Get token and deny it
    try:
        verify_token = await VerifyUserToken.create(token)
    except tokens_ex.DeniedTokenError:
        raise ex.UsedVerifyUserTokenError("The token has already been used.")
    except tokens_ex.ExpiredTokenError:
        raise ex.ExpiredVerifyUserTokenError("The token has expired.")
    except tokens_ex.TokenError:
        raise ex.BadVerifyUserTokenError("Invalid or malformed token.")

    await verify_token.denylist()

    # Get user and verify it
    user = await users_repositories.get_user(filters=verify_token.object_data)
    if not user:
        raise ex.BadVerifyUserTokenError("The user doesn't exist.")

    await verify_user(user=user)
    await project_invitations_services.update_user_projects_invitations(user=user)
    await workspace_invitations_services.update_user_workspaces_invitations(user=user)

    # The user may have a pending invitation to join a project or a workspace
    project_invitation, workspace_invitation = await _accept_invitations_from_token(
        user=user,
        verify_token=verify_token,
    )

    # Generate auth credentials and attach invitation
    auth = await auth_services.create_auth_credentials(user=user)
    return serializers_services.serialize_verification_info(
        auth=auth, project_invitation=project_invitation, workspace_invitation=workspace_invitation
    )


#####################################################################
# list users
#####################################################################


async def list_users_emails_as_dict(
    emails: list[str],
) -> dict[str, User]:
    users = await users_repositories.list_users(filters={"is_active": True, "emails": emails})
    return {u.email: u for u in users}


async def list_users_usernames_as_dict(
    usernames: list[str],
) -> dict[str, User]:
    users = await users_repositories.list_users(filters={"is_active": True, "usernames": usernames})
    return {u.username: u for u in users}


async def list_guests_in_workspace_for_project(
    project: Project,
) -> list[User]:
    return await users_repositories.list_users(filters={"guest_in_ws_for_project": project})


# search users
async def list_paginated_users_by_text(
    offset: int,
    limit: int,
    text: str | None = None,
    project_id: UUID | None = None,
    workspace_id: UUID | None = None,
) -> tuple[Pagination, list[User]]:

    if workspace_id:
        total_users = await users_repositories.get_total_workspace_users_by_text(
            text_search=text, workspace_id=workspace_id
        )
        users = await users_repositories.list_workspace_users_by_text(
            text_search=text, workspace_id=workspace_id, offset=offset, limit=limit
        )
    else:
        total_users = await users_repositories.get_total_project_users_by_text(text_search=text, project_id=project_id)
        users = await users_repositories.list_project_users_by_text(
            text_search=text, project_id=project_id, offset=offset, limit=limit
        )

    pagination = Pagination(offset=offset, limit=limit, total=total_users)

    return pagination, users


#####################################################################
# update user
#####################################################################


async def update_user(user: User, full_name: str, lang: str) -> User:
    updated_user = await users_repositories.update_user(
        user=user,
        values={"full_name": full_name, "lang": lang},
    )
    return updated_user


#####################################################################
# reset password
#####################################################################


async def _get_user_and_reset_password_token(token: str) -> tuple[ResetPasswordToken, User]:
    try:
        reset_token = await ResetPasswordToken.create(token)
    except tokens_ex.DeniedTokenError:
        raise ex.UsedResetPasswordTokenError("The token has already been used.")
    except tokens_ex.ExpiredTokenError:
        raise ex.ExpiredResetPassswordTokenError("The token has expired.")
    except tokens_ex.TokenError:
        raise ex.BadResetPasswordTokenError("Invalid or malformed token.")

    # Get user
    user = await users_repositories.get_user(filters={"id": reset_token.object_data["id"], "is_active": True})
    if not user:
        await reset_token.denylist()
        raise ex.BadResetPasswordTokenError("Invalid or malformed token.")

    return reset_token, user


async def _generate_reset_password_token(user: User) -> str:
    return str(await ResetPasswordToken.create_for_object(user))


async def _send_reset_password_email(user: User) -> None:
    context = {"reset_password_token": await _generate_reset_password_token(user)}
    await send_email.defer(email_name=Emails.RESET_PASSWORD.value, to=user.email, context=context, lang=user.lang)


async def request_reset_password(email: str) -> None:
    user = await users_repositories.get_user(filters={"username_or_email": email, "is_active": True})
    if user:
        await _send_reset_password_email(user)


async def verify_reset_password_token(token: str) -> bool:
    return bool(await _get_user_and_reset_password_token(token))


async def reset_password(token: str, password: str) -> User | None:
    reset_token, user = await _get_user_and_reset_password_token(token)

    if user:
        await users_repositories.change_password(user=user, password=password)
        await reset_token.denylist()
        return user

    return None


#####################################################################
# misc
#####################################################################


async def clean_expired_users() -> None:
    await users_repositories.clean_expired_users()


async def _accept_invitations_from_token(
    user: User, verify_token: VerifyUserToken
) -> tuple[ProjectInvitation | None, WorkspaceInvitation | None]:
    project_invitation_token = verify_token.get("project_invitation_token", None)
    if project_invitation_token:
        project_invitation = await _accept_project_invitation_from_token(
            invitation_token=project_invitation_token,
            accept_invitation=verify_token.get("accept_project_invitation", False),
            user=user,
        )
        return project_invitation, None

    workspace_invitation_token = verify_token.get("workspace_invitation_token", None)
    if workspace_invitation_token:
        workspace_invitation = await _accept_workspace_invitation_from_token(
            invitation_token=workspace_invitation_token,
            accept_invitation=verify_token.get("accept_workspace_invitation", False),
            user=user,
        )
        return None, workspace_invitation

    return None, None


async def _accept_project_invitation_from_token(
    invitation_token: str, accept_invitation: bool, user: User
) -> ProjectInvitation | None:
    # Accept project invitation, if it exists and the user comes from the email's CTA. Errors will be ignored
    invitation = None
    if accept_invitation and invitation_token:
        try:
            await project_invitations_services.accept_project_invitation_from_token(
                token=invitation_token,
                user=user,
            )
        except (
            invitations_ex.BadInvitationTokenError,
            invitations_ex.InvitationDoesNotExistError,
            invitations_ex.InvitationIsNotForThisUserError,
            invitations_ex.InvitationAlreadyAcceptedError,
            invitations_ex.InvitationRevokedError,
        ):
            pass  # TODO: Logging invitation is invalid
    if invitation_token:
        try:
            invitation = await project_invitations_services.get_project_invitation(token=invitation_token)
        except (invitations_ex.BadInvitationTokenError, invitations_ex.InvitationDoesNotExistError):
            pass  # TODO: Logging invitation is invalid
    return invitation


async def _accept_workspace_invitation_from_token(
    invitation_token: str, accept_invitation: bool, user: User
) -> WorkspaceInvitation | None:
    # Accept workspace invitation, if it exists and the user comes from the email's CTA. Errors will be ignored
    invitation = None
    if accept_invitation and invitation_token:
        try:
            await workspace_invitations_services.accept_workspace_invitation_from_token(
                token=invitation_token,
                user=user,
            )
        except (
            invitations_ex.BadInvitationTokenError,
            invitations_ex.InvitationDoesNotExistError,
            invitations_ex.InvitationIsNotForThisUserError,
            invitations_ex.InvitationAlreadyAcceptedError,
            invitations_ex.InvitationRevokedError,
        ):
            pass  # TODO: Logging invitation is invalid
    if invitation_token:
        try:
            invitation = await workspace_invitations_services.get_workspace_invitation(token=invitation_token)
        except (invitations_ex.BadInvitationTokenError, invitations_ex.InvitationDoesNotExistError):
            pass  # TODO: Logging invitation is invalid
    return invitation
