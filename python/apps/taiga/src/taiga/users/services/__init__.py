# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import cast
from uuid import UUID

from taiga.auth import services as auth_services
from taiga.base.api.pagination import Pagination
from taiga.base.utils.colors import generate_random_color
from taiga.base.utils.datetime import aware_utcnow
from taiga.conf import settings
from taiga.emails.emails import Emails
from taiga.emails.tasks import send_email
from taiga.projects.invitations import events as pj_invitations_events
from taiga.projects.invitations import repositories as pj_invitations_repositories
from taiga.projects.invitations import services as project_invitations_services
from taiga.projects.invitations.choices import ProjectInvitationStatus
from taiga.projects.invitations.models import ProjectInvitation
from taiga.projects.invitations.services import exceptions as invitations_ex
from taiga.projects.memberships import events as pj_memberships_events
from taiga.projects.memberships import repositories as pj_memberships_repositories
from taiga.projects.projects import repositories as projects_repositories
from taiga.projects.projects import services as projects_services
from taiga.projects.projects.models import Project
from taiga.projects.roles import repositories as pj_roles_repositories
from taiga.tokens import exceptions as tokens_ex
from taiga.users import events as users_events
from taiga.users import repositories as users_repositories
from taiga.users.models import User
from taiga.users.repositories import UserFilters
from taiga.users.serializers import UserDeleteInfoSerializer, VerificationInfoSerializer
from taiga.users.serializers import services as serializers_services
from taiga.users.services import exceptions as ex
from taiga.users.tokens import ResetPasswordToken, VerifyUserToken
from taiga.workspaces.invitations import events as ws_invitations_events
from taiga.workspaces.invitations import repositories as ws_invitations_repositories
from taiga.workspaces.invitations import services as workspace_invitations_services
from taiga.workspaces.invitations.choices import WorkspaceInvitationStatus
from taiga.workspaces.invitations.models import WorkspaceInvitation
from taiga.workspaces.memberships import events as ws_memberships_events
from taiga.workspaces.memberships import repositories as ws_memberships_repositories
from taiga.workspaces.workspaces import events as workspaces_events
from taiga.workspaces.workspaces import repositories as workspaces_repositories
from taiga.workspaces.workspaces.models import Workspace

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
    user = await users_repositories.get_user(filters=cast(UserFilters, verify_token.object_data))
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
    text: str,
    offset: int,
    limit: int,
    workspace_id: UUID | None = None,
    project_id: UUID | None = None,
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
# delete user
#####################################################################


async def delete_user(user: User) -> bool:
    # delete workspaces where the user is the only ws member
    # (all members, invitations, projects, pj-members, pj-invitations,
    # pj-roles, stories, comments, etc will be deleted in cascade)
    workspaces = await workspaces_repositories.list_workspaces(
        filters={"workspace_member_id": user.id, "num_members": 1}
    )
    for ws in workspaces:
        ws_deleted = await workspaces_repositories.delete_workspaces(filters={"id": ws.id})
        if ws_deleted > 0:
            await workspaces_events.emit_event_when_workspace_is_deleted(workspace=ws, deleted_by=user)

    # delete projects where the user is the only pj member
    # (all members, invitations, pj-roles, stories, comments, etc
    # will be deleted in cascade)
    projects = await projects_repositories.list_projects(
        filters={"project_member_id": user.id, "is_onewoman_project": True},
    )
    [await projects_services.delete_project(project=pj, deleted_by=user) for pj in projects]

    # update role of a workspace member as project admin in projects where the user is the only pj admin
    # better if the workspace member is project member too
    projects = await projects_repositories.list_projects(
        filters={"project_member_id": user.id, "is_admin": True, "num_admins": 1, "is_onewoman_project": False},
        select_related=["workspace"],
    )
    for pj in projects:
        workspace_members = await ws_memberships_repositories.list_workspace_members_excluding_user(
            workspace=pj.workspace, exclude_user=user
        )
        project_members = await pj_memberships_repositories.list_project_members_excluding_user(
            project=pj, exclude_user=user
        )

        project_admin_role = await pj_roles_repositories.get_project_role(
            filters={"project_id": pj.id, "slug": "admin"}
        )
        common_members = list(set(workspace_members).intersection(project_members))
        if len(common_members) > 0:
            pj_membership = await pj_memberships_repositories.get_project_membership(
                filters={"project_id": pj.id, "user_id": common_members[0].id},
                select_related=["user", "role", "project", "project__workspace"],
            )
            if pj_membership and project_admin_role:
                updated_pj_membership = await pj_memberships_repositories.update_project_membership(
                    membership=pj_membership,
                    values={"role": project_admin_role},
                )
                await pj_memberships_events.emit_event_when_project_membership_is_updated(
                    membership=updated_pj_membership
                )
        else:
            if project_admin_role:
                created_pj_membership = await pj_memberships_repositories.create_project_membership(
                    project=pj, role=project_admin_role, user=workspace_members[0]
                )
                await pj_memberships_events.emit_event_when_project_membership_is_created(
                    membership=created_pj_membership
                )

    # delete ws memberships
    ws_memberships = await ws_memberships_repositories.list_workspace_memberships(
        filters={"user_id": user.id}, select_related=["user", "workspace"]
    )
    for ws_membership in ws_memberships:
        deleted = await ws_memberships_repositories.delete_workspace_memberships(
            filters={"id": ws_membership.id},
        )
        if deleted > 0:
            await ws_memberships_events.emit_event_when_workspace_membership_is_deleted(membership=ws_membership)

    # delete ws invitations
    ws_invitations = await ws_invitations_repositories.list_workspace_invitations(
        filters={"user": user},
        select_related=["workspace"],
    )
    for ws_invitation in ws_invitations:
        is_pending = True if ws_invitation.status == WorkspaceInvitationStatus.PENDING else False
        deleted = await ws_invitations_repositories.delete_workspace_invitation(filters={"id": ws_invitation.id})
        if deleted > 0 and is_pending:
            await ws_invitations_events.emit_event_when_workspace_invitation_is_deleted(invitation=ws_invitation)

    # delete pj memberships
    pj_memberships = await pj_memberships_repositories.list_project_memberships(
        filters={"user_id": user.id},
        select_related=["user", "project", "project__workspace"],
    )
    for pj_membership in pj_memberships:
        deleted = await pj_memberships_repositories.delete_project_membership(
            filters={"id": pj_membership.id},
        )
        if deleted > 0:
            await pj_memberships_events.emit_event_when_project_membership_is_deleted(membership=pj_membership)

    # delete pj invitations
    pj_invitations = await pj_invitations_repositories.list_project_invitations(
        filters={"user": user},
        select_related=["project"],
    )
    for pj_invitation in pj_invitations:
        is_pending = True if pj_invitation.status == ProjectInvitationStatus.PENDING else False
        deleted = await pj_invitations_repositories.delete_project_invitation(filters={"id": pj_invitation.id})
        if deleted > 0 and is_pending:
            await pj_invitations_events.emit_event_when_project_invitation_is_deleted(invitation=pj_invitation)

    # delete user
    deleted_user = await users_repositories.delete_user(filters={"id": user.id})

    if deleted_user > 0:
        await users_events.emit_event_when_user_is_deleted(user=user)
        return True

    return False


#####################################################################
# delete info user
#####################################################################


async def get_user_delete_info(user: User) -> UserDeleteInfoSerializer:
    ws_list = await _list_workspaces_delete_info(user=user)
    pj_list = await _list_projects_delete_info(user=user, ws_list=ws_list)

    ws_list_serialized = [
        serializers_services.serialize_workspace_with_projects_nested(
            workspace=workspace, projects=await workspaces_repositories.list_workspace_projects(workspace=workspace)
        )
        for workspace in ws_list
    ]

    return serializers_services.serialize_user_delete_info(workspaces=ws_list_serialized, projects=pj_list)


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


async def _list_workspaces_delete_info(user: User) -> list[Workspace]:
    # list workspaces where the user is the only ws member and ws has projects
    return await workspaces_repositories.list_workspaces(
        filters={"workspace_member_id": user.id, "num_members": 1, "has_projects": True},
        prefetch_related=["projects"],
    )


async def _list_projects_delete_info(user: User, ws_list: list[Workspace]) -> list[Project]:
    # list projects where the user is the only pj admin and is not the only ws member or is not ws member

    # list projects where the user is the only ws member
    pj_list_user_only_ws_member = []
    for ws in ws_list:
        pj_list_user_only_ws_member += await workspaces_repositories.list_workspace_projects(workspace=ws)

    pj_list_user_only_admin = await projects_repositories.list_projects(
        filters={"project_member_id": user.id, "is_admin": True, "num_admins": 1, "is_onewoman_project": False},
        select_related=["workspace"],
    )

    return [pj for pj in pj_list_user_only_admin if pj not in pj_list_user_only_ws_member]
