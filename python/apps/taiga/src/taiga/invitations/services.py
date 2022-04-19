# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.emails.emails import Emails
from taiga.emails.tasks import send_email
from taiga.invitations import exceptions as ex
from taiga.invitations import repositories as invitations_repositories
from taiga.invitations.choices import InvitationStatus
from taiga.invitations.models import Invitation, PublicInvitation
from taiga.invitations.tokens import ProjectInvitationToken
from taiga.projects.models import Project
from taiga.projects.services import get_logo_small_thumbnail_url
from taiga.roles import exceptions as roles_ex
from taiga.roles import repositories as roles_repositories
from taiga.tokens import TokenError
from taiga.users import repositories as users_repositories
from taiga.users.models import User


async def get_project_invitation(token: str) -> Invitation | None:
    try:
        invitation_token = await ProjectInvitationToken.create(token=token)
    except TokenError:
        raise ex.BadInvitationTokenError()

    # Get invitation
    if invitation_data := invitation_token.object_data:
        return await invitations_repositories.get_project_invitation(**invitation_data)

    return None


async def get_public_project_invitation(token: str) -> PublicInvitation | None:
    if invitation := await get_project_invitation(token=token):
        invited_user = await users_repositories.get_user_by_username_or_email(invitation.email)

        return PublicInvitation(
            status=invitation.status,
            email=invitation.email,
            existing_user=invited_user is not None,
            project=invitation.project,
        )

    return None


async def get_project_invitations(project: Project) -> list[Invitation]:
    return await invitations_repositories.get_project_invitations(project.slug)


async def send_project_invitation_email(invitation: Invitation) -> None:
    project = invitation.project
    sender = invitation.invited_by
    receiver = invitation.user
    email = receiver.email if receiver else invitation.email
    invitation_token = await ProjectInvitationToken.create_for_object(invitation)

    context = {
        "invitation_token": str(invitation_token),
        "project_name": project.name,
        "project_slug": project.slug,
        "project_color": project.color,
        "project_image_url": await get_logo_small_thumbnail_url(project.logo),
        "project_description": project.description,
        "sender_name": sender.full_name,
        "receiver_name": receiver.full_name if receiver else None,
    }

    await send_email.defer(
        email_name=Emails.PROJECT_INVITATION.value,
        to=email,
        context=context,
    )


async def create_invitations(project: Project, invitations: list[dict[str, str]], invited_by: User) -> list[Invitation]:
    # project's roles dict, whose key is the role slug and value the Role object
    # {'admin': Role1, 'general': Role2}
    project_roles_dict = await roles_repositories.get_project_roles_as_dict(project=project)
    # set a list of roles slug {'admin', 'general'}
    project_roles_slugs = set(project_roles_dict.keys())
    # create two lists with roles_slug and emails received
    roles_slug = []
    emails = []
    for invitation in invitations:
        roles_slug.append(invitation["role_slug"])
        emails.append(invitation["email"])

    # if some role_slug doesn't exist in project's roles then raise an exception
    if not set(roles_slug).issubset(project_roles_slugs):
        raise roles_ex.NonExistingRoleError()

    # users dict, whose key is the email and value the User object
    # {'user1@taiga.demo': User1, 'user2@taiga.demo': User2}
    users_dict = await users_repositories.get_users_by_emails_as_dict(emails=emails)

    # create invitations objects list
    objs = []
    for email, role_slug in zip(emails, roles_slug):
        objs.append(
            Invitation(
                user=users_dict.get(email, None),
                project=project,
                role=project_roles_dict[role_slug],
                email=email,
                invited_by=invited_by,
            )
        )

    invitations = await invitations_repositories.create_invitations(objs=objs)

    for invitation in invitations:
        await send_project_invitation_email(invitation=invitation)

    return invitations


async def accept_project_invitation(invitation: Invitation, user: User) -> Invitation:
    if invitation.status == InvitationStatus.ACCEPTED:
        raise ex.InvitationAlreadyAcceptedError()

    accepted_invitation = await invitations_repositories.accept_project_invitation(invitation=invitation, user=user)

    await roles_repositories.create_membership(project=invitation.project, role=invitation.role, user=invitation.user)

    return accepted_invitation
