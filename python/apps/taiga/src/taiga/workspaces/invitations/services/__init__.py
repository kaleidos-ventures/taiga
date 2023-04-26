# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any

from taiga.base.utils.datetime import aware_utcnow
from taiga.base.utils.emails import is_email
from taiga.conf import settings
from taiga.emails.emails import Emails
from taiga.emails.tasks import send_email
from taiga.users import services as users_services
from taiga.users.models import User
from taiga.workspaces.invitations import events as invitations_events
from taiga.workspaces.invitations import repositories as invitations_repositories
from taiga.workspaces.invitations.choices import WorkspaceInvitationStatus
from taiga.workspaces.invitations.models import WorkspaceInvitation
from taiga.workspaces.invitations.serializers import CreateWorkspaceInvitationsSerializer
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
            if not await _is_spam(invitation):
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

    if invitations_to_send_list:
        await invitations_events.emit_event_when_workspace_invitations_are_created(
            workspace=workspace, invitations=invitations_to_send_list
        )

    return serializers_services.serialize_create_workspace_invitations(
        invitations=list(invitations_to_send_list), already_members=already_members
    )


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


async def _get_time_since_last_send(invitation: WorkspaceInvitation) -> int:
    last_send_at = invitation.resent_at if invitation.resent_at else invitation.created_at
    return int((aware_utcnow() - last_send_at).total_seconds() / 60)  # in minutes


async def _is_spam(invitation: WorkspaceInvitation) -> bool:
    time_since_last_send = await _get_time_since_last_send(invitation)
    if (
        invitation.num_emails_sent < settings.WORKSPACE_INVITATION_RESEND_LIMIT
        and time_since_last_send >= settings.WORKSPACE_INVITATION_RESEND_TIME
    ):
        return False

    return True
