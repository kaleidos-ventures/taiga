# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.base.utils import emails
from taiga.conf import settings
from taiga.emails.emails import Emails
from taiga.emails.tasks import send_email
from taiga.invitations import exceptions as ex
from taiga.invitations import repositories as invitations_repositories
from taiga.invitations.choices import InvitationStatus
from taiga.invitations.dataclasses import PublicInvitation
from taiga.invitations.models import Invitation
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
    return await invitations_repositories.get_project_invitation(**invitation_token.object_data)


async def get_public_project_invitation(token: str) -> PublicInvitation | None:
    if invitation := await get_project_invitation(token=token):
        invited_user = invitation.user or await users_repositories.get_user_by_username_or_email(invitation.email)

        return PublicInvitation(
            status=invitation.status,
            email=invitation.email,
            existing_user=invited_user is not None,
            project=invitation.project,
        )

    return None


async def get_project_invitations(project: Project, user: User) -> list[Invitation]:
    if user.is_anonymous:
        return []

    role = await roles_repositories.get_role_for_user(user_id=user.id, project_id=project.id)

    if role and role.is_admin:
        return await invitations_repositories.get_project_invitations(
            project_slug=project.slug, status=InvitationStatus.PENDING
        )
    else:
        return await invitations_repositories.get_project_invitations(
            project_slug=project.slug, status=InvitationStatus.PENDING, user=user
        )


async def get_project_invitation_by_user(project_slug: str, user: User) -> Invitation | None:
    return await invitations_repositories.get_project_invitation_by_user(project_slug=project_slug, user=user)


async def _generate_project_invitation_token(invitation: Invitation) -> str:
    return str(await ProjectInvitationToken.create_for_object(invitation))


async def send_project_invitation_email(invitation: Invitation) -> None:
    project = invitation.project
    sender = invitation.invited_by
    receiver = invitation.user
    email = receiver.email if receiver else invitation.email
    invitation_token = await _generate_project_invitation_token(invitation)

    context = {
        "invitation_token": invitation_token,
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
    # create two lists with roles_slug and emails received
    roles_slug = []
    emails = []
    for invitation in invitations:
        roles_slug.append(invitation["role_slug"])
        email = invitation["email"].lower()
        if email in emails:
            raise ex.DuplicatedEmailError()
        emails.append(email)

    # project's roles dict, whose key is the role slug and value the Role object
    # {'admin': Role1, 'general': Role2}
    project_roles_dict = await roles_repositories.get_project_roles_as_dict(project=project)
    # set a list of roles slug {'admin', 'general'}
    project_roles_slugs = set(project_roles_dict.keys())

    # if some role_slug doesn't exist in project's roles then raise an exception
    if not set(roles_slug).issubset(project_roles_slugs):
        raise roles_ex.NonExistingRoleError()

    # users dict, whose key is the email and value the User object
    # {'user1@taiga.demo': User1, 'user2@taiga.demo': User2}
    users_dict = await users_repositories.get_users_by_emails_as_dict(emails=emails)

    # create or update invitations and send invitations
    invitations_to_create = []
    invitations_to_update = []
    invitations_to_send = []
    project_members = await roles_repositories.get_project_members(project=project)
    for email, role_slug in zip(emails, roles_slug):
        user = users_dict.get(email, None)
        # check if user is already member and do nothing
        if user and user in project_members:
            continue
        # check if this email has already a pending invitation
        pending_invitation = await invitations_repositories.get_project_invitation_by_email(
            project_slug=project.slug, email=email, status=InvitationStatus.PENDING
        )
        if pending_invitation:
            pending_invitation.project = project
            pending_invitation.user = user
            pending_invitation.role = project_roles_dict[role_slug]
            pending_invitation.invited_by = invited_by
            # num_emails_sent >= PROJECT_INVITATION_RESEND_LIMIT not send email
            if pending_invitation.num_emails_sent < settings.PROJECT_INVITATION_RESEND_LIMIT:
                invitations_to_send.append(pending_invitation)
                pending_invitation.num_emails_sent += 1

            invitations_to_update.append(pending_invitation)
        else:
            new_invitation = Invitation(
                user=user,
                project=project,
                role=project_roles_dict[role_slug],
                email=email,
                invited_by=invited_by,
            )
            invitations_to_create.append(new_invitation)
            invitations_to_send.append(new_invitation)

    if len(invitations_to_update) > 0:
        await invitations_repositories.update_invitations(objs=invitations_to_update)

    if len(invitations_to_create) > 0:
        await invitations_repositories.create_invitations(objs=invitations_to_create)

    for invitation in invitations_to_send:
        await send_project_invitation_email(invitation=invitation)

    return invitations_to_send


async def accept_project_invitation(invitation: Invitation, user: User) -> Invitation:
    if invitation.status == InvitationStatus.ACCEPTED:
        raise ex.InvitationAlreadyAcceptedError()

    accepted_invitation = await invitations_repositories.accept_project_invitation(invitation=invitation, user=user)

    await roles_repositories.create_membership(project=invitation.project, role=invitation.role, user=invitation.user)

    return accepted_invitation


async def accept_project_invitation_from_token(token: str, user: User) -> Invitation:
    invitation = await get_project_invitation(token=token)

    if not invitation:
        raise ex.InvitationDoesNotExistError()

    if not is_project_invitation_for_this_user(invitation=invitation, user=user):
        raise ex.InvitationIsNotForThisUserError()

    return await accept_project_invitation(invitation=invitation, user=user)


def is_project_invitation_for_this_user(invitation: Invitation, user: User) -> bool:
    """
    Check if a project invitation if for an specific user. First try to compare the user associated and, if
    there is no one, compare the email.
    """
    return (user.id == invitation.user_id is not None) or emails.are_the_same(user.email, invitation.email)


async def has_pending_project_invitation_for_user(project: Project, user: User) -> bool:
    return await invitations_repositories.has_pending_project_invitation_for_user(user=user, project=project)
