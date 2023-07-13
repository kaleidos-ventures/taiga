# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any

from taiga.auth import services as auth_services
from taiga.base.api.pagination import Pagination
from taiga.base.utils import emails
from taiga.base.utils.datetime import aware_utcnow
from taiga.base.utils.emails import is_email
from taiga.commons.invitations import is_spam
from taiga.conf import settings
from taiga.emails.emails import Emails
from taiga.emails.tasks import send_email
from taiga.tokens.exceptions import TokenError
from taiga.users import services as users_services
from taiga.users.models import User
from taiga.workspaces.invitations import events as invitations_events
from taiga.workspaces.invitations import repositories as invitations_repositories
from taiga.workspaces.invitations.choices import WorkspaceInvitationStatus
from taiga.workspaces.invitations.models import WorkspaceInvitation
from taiga.workspaces.invitations.serializers import (
    CreateWorkspaceInvitationsSerializer,
    PublicWorkspaceInvitationSerializer,
)
from taiga.workspaces.invitations.serializers import services as serializers_services
from taiga.workspaces.invitations.services import exceptions as ex
from taiga.workspaces.invitations.tokens import WorkspaceInvitationToken
from taiga.workspaces.memberships import repositories as memberships_repositories
from taiga.workspaces.workspaces.models import Workspace

##########################################################
# create workspace invitations
##########################################################


async def create_workspace_invitations(
    workspace: Workspace,
    invitations: list[dict[str, str]],
    invited_by: User,
) -> CreateWorkspaceInvitationsSerializer:
    already_members = 0
    usernames: list[str] = []
    emails: list[str] = []
    # split invitations in emails and usernames
    for i in invitations:
        if is_email(i["username_or_email"]):
            emails.append(i["username_or_email"].lower())
        else:
            usernames.append(i["username_or_email"].lower())

    users_emails_dict: dict[str, Any] = {}
    if len(emails) > 0:
        users_emails_dict = await users_services.list_users_emails_as_dict(emails=emails)
    # users_emails_dict = {
    #   'user1@taiga.demo': <User: Norma Fisher>,
    #   'user3@taiga.demo': <User: Elisabeth Woods>,
    # }
    users_usernames_dict: dict[str, Any] = {}
    if len(usernames) > 0:
        users_usernames_dict = await users_services.list_users_usernames_as_dict(usernames=usernames)
        # users_usernames_dict = {
        #   'user3': <User: Elizabeth Woods>,
        # }
        # all usernames should belong to a user; otherwise it's an error
        if len(users_usernames_dict) < len(usernames):
            wrong_usernames = set(usernames) - users_usernames_dict.keys()
            raise ex.NonExistingUsernameError(f"These usernames don't exist: {wrong_usernames}")

    invitations_to_create: dict[str, WorkspaceInvitation] = {}
    invitations_to_update: dict[str, WorkspaceInvitation] = {}
    invitations_to_send: dict[str, WorkspaceInvitation] = {}
    workspace_members = await memberships_repositories.list_workspace_members(workspace=workspace)

    users_dict = users_emails_dict | users_usernames_dict
    # users_dict = {
    #         'user1@taiga.demo': <User: Norma Fisher>,
    #         'user3': <User: Elizabeth Woods>,
    #         'user3@taiga.demo': <User: Elizabeth Woods>,
    # }

    for key in emails + usernames:
        #                                  key
        # ====================================
        # (1st iteration)   'user1@taiga.demo'
        # (2nd iteration)              'user3'

        user = users_dict.get(key)
        if user and user in workspace_members:
            already_members += 1
            continue
        email = user.email if user else key

        # check if the user has already an invitation pending or revoked
        invitation = await invitations_repositories.get_workspace_invitation(
            filters={
                "workspace_id": workspace.id,
                "username_or_email": email,
                "statuses": [WorkspaceInvitationStatus.PENDING, WorkspaceInvitationStatus.REVOKED],
            },
            select_related=["user", "workspace", "invited_by"],
        )

        if invitation:
            # if the user has an invitation, the system uses it
            invitation.status = WorkspaceInvitationStatus.PENDING
            if not is_spam(invitation):
                invitation.num_emails_sent += 1
                invitation.resent_at = aware_utcnow()
                invitation.resent_by = invited_by
                invitations_to_send[email] = invitation
            invitations_to_update[email] = invitation
        else:
            # otherwise, the system creates a new one
            new_invitation = WorkspaceInvitation(
                user=user,
                workspace=workspace,
                email=email,
                invited_by=invited_by,
            )
            invitations_to_create[email] = new_invitation
            invitations_to_send[email] = new_invitation

    if len(invitations_to_update) > 0:
        objs = list(invitations_to_update.values())
        await invitations_repositories.bulk_update_workspace_invitations(
            objs_to_update=invitations_to_update.values(),
            fields_to_update=["num_emails_sent", "resent_at", "resent_by", "status"],
        )

    if len(invitations_to_create) > 0:
        objs = list(invitations_to_create.values())
        await invitations_repositories.create_workspace_invitations(objs=objs)

    invitations_to_send_list = invitations_to_send.values()
    for invitation in invitations_to_send_list:
        await send_workspace_invitation_email(invitation=invitation)

    if len(invitations_to_create) + len(invitations_to_update) > 0:
        invitations_to_publish = (invitations_to_create | invitations_to_update).values()
        await invitations_events.emit_event_when_workspace_invitations_are_created(
            workspace=workspace, invitations=invitations_to_publish
        )

    return serializers_services.serialize_create_workspace_invitations(
        invitations=list(invitations_to_send_list), already_members=already_members
    )


##########################################################
# list workspace invitations
##########################################################


async def list_paginated_pending_workspace_invitations(
    workspace: Workspace, offset: int, limit: int
) -> tuple[Pagination, list[WorkspaceInvitation]]:
    pagination = Pagination(offset=offset, limit=limit, total=0)

    invitations = await invitations_repositories.list_workspace_invitations(
        filters={"workspace_id": workspace.id, "status": WorkspaceInvitationStatus.PENDING},
        select_related=["user", "workspace"],
        offset=offset,
        limit=limit,
    )
    total_invitations = await invitations_repositories.get_total_workspace_invitations(
        filters={"workspace_id": workspace.id, "status": WorkspaceInvitationStatus.PENDING},
    )

    pagination.total = total_invitations
    return pagination, invitations


##########################################################
# get workspace invitation
##########################################################


async def get_workspace_invitation(token: str) -> WorkspaceInvitation | None:
    try:
        invitation_token = await WorkspaceInvitationToken.create(token=token)
    except TokenError:
        raise ex.BadInvitationTokenError("Invalid token")

    return await invitations_repositories.get_workspace_invitation(
        filters=invitation_token.object_data,
        select_related=["user", "workspace"],
    )


async def get_public_workspace_invitation(token: str) -> PublicWorkspaceInvitationSerializer | None:
    if invitation := await get_workspace_invitation(token=token):

        available_logins = (
            await auth_services.get_available_user_logins(user=invitation.user) if invitation.user else []
        )
        return serializers_services.serialize_public_workspace_invitation(
            invitation=invitation, available_logins=available_logins
        )

    return None


##########################################################
# update workspace invitations
##########################################################


async def update_user_workspaces_invitations(user: User) -> None:
    await invitations_repositories.update_user_workspaces_invitations(user=user)
    invitations = await invitations_repositories.list_workspace_invitations(
        filters={"user": user, "status": WorkspaceInvitationStatus.PENDING},
        select_related=["workspace"],
    )
    await invitations_events.emit_event_when_workspace_invitations_are_updated(invitations=invitations)


##########################################################
# accept workspace invitation
##########################################################


async def accept_workspace_invitation(invitation: WorkspaceInvitation) -> WorkspaceInvitation:
    if invitation.status == WorkspaceInvitationStatus.ACCEPTED:
        raise ex.InvitationAlreadyAcceptedError("The invitation has already been accepted")

    if invitation.status == WorkspaceInvitationStatus.REVOKED:
        raise ex.InvitationRevokedError("The invitation is revoked")

    accepted_invitation = await invitations_repositories.update_workspace_invitation(
        invitation=invitation,
        values={"status": WorkspaceInvitationStatus.ACCEPTED},
    )

    await memberships_repositories.create_workspace_membership(workspace=invitation.workspace, user=invitation.user)
    await invitations_events.emit_event_when_workspace_invitation_is_accepted(invitation=invitation)

    return accepted_invitation


async def accept_workspace_invitation_from_token(token: str, user: User) -> WorkspaceInvitation:
    invitation = await get_workspace_invitation(token=token)

    if not invitation:
        raise ex.InvitationDoesNotExistError("Invitation does not exist")

    if not is_workspace_invitation_for_this_user(invitation=invitation, user=user):
        raise ex.InvitationIsNotForThisUserError("Invitation is not for this user")

    return await accept_workspace_invitation(invitation=invitation)


##########################################################
# send workspace invitation
##########################################################


async def send_workspace_invitation_email(
    invitation: WorkspaceInvitation,
    is_resend: bool | None = False,
) -> None:
    workspace = invitation.workspace
    sender = invitation.resent_by if is_resend else invitation.invited_by
    receiver = invitation.user
    email = receiver.email if receiver else invitation.email
    invitation_token = await _generate_workspace_invitation_token(invitation)

    context = {
        "invitation_token": invitation_token,
        "workspace_name": workspace.name,
        "workspace_id": workspace.b64id,
        "workspace_color": workspace.color,
        "sender_name": sender.full_name if sender else None,
        "receiver_name": receiver.full_name if receiver else None,
    }

    await send_email.defer(
        email_name=Emails.WORKSPACE_INVITATION.value,
        to=email,
        context=context,
        lang=receiver.lang if receiver else settings.LANG,
    )


##########################################################
# misc
##########################################################


async def _generate_workspace_invitation_token(invitation: WorkspaceInvitation) -> str:
    return str(await WorkspaceInvitationToken.create_for_object(invitation))


def is_workspace_invitation_for_this_user(invitation: WorkspaceInvitation, user: User) -> bool:
    """
    Check if a workspace invitation if for a specific user
    """
    return emails.are_the_same(user.email, invitation.email)
