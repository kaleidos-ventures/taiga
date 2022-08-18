# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.base.api.pagination import Pagination
from taiga.base.utils import emails
from taiga.base.utils.datetime import aware_utcnow
from taiga.conf import settings
from taiga.emails.emails import Emails
from taiga.emails.tasks import send_email
from taiga.invitations import events as invitations_events
from taiga.invitations import repositories as invitations_repositories
from taiga.invitations.choices import ProjectInvitationStatus
from taiga.invitations.dataclasses import CreateProjectInvitations, PublicProjectInvitation
from taiga.invitations.models import ProjectInvitation
from taiga.invitations.services import exceptions as ex
from taiga.invitations.tokens import ProjectInvitationToken
from taiga.projects.models import Project
from taiga.projects.services import get_logo_small_thumbnail_url
from taiga.roles import repositories as roles_repositories
from taiga.tokens.exceptions import TokenError
from taiga.users import repositories as users_repositories
from taiga.users.models import AnyUser, User


async def get_project_invitation(token: str) -> ProjectInvitation | None:
    try:
        invitation_token = await ProjectInvitationToken.create(token=token)
    except TokenError:
        raise ex.BadInvitationTokenError("Invalid token")

    return await invitations_repositories.get_project_invitation(**invitation_token.object_data)


async def get_public_project_invitation(token: str) -> PublicProjectInvitation | None:
    if invitation := await get_project_invitation(token=token):

        return PublicProjectInvitation(
            status=invitation.status,
            email=invitation.email,
            existing_user=invitation.user is not None,
            project=invitation.project,
        )

    return None


async def get_project_invitation_by_username_or_email(
    project_slug: str, username_or_email: str
) -> ProjectInvitation | None:
    return await invitations_repositories.get_project_invitation_by_username_or_email(
        project_slug=project_slug, username_or_email=username_or_email
    )


async def get_paginated_pending_project_invitations(
    project: Project, user: AnyUser, offset: int, limit: int
) -> tuple[Pagination, list[ProjectInvitation]]:
    pagination = Pagination(offset=offset, limit=limit, total=0)

    if user.is_anonymous:
        return pagination, []

    role = await roles_repositories.get_role_for_user(user_id=user.id, project_id=project.id)

    if role and role.is_admin:
        invitations = await invitations_repositories.get_project_invitations(
            project_slug=project.slug, status=ProjectInvitationStatus.PENDING, offset=offset, limit=limit
        )
        total_invitations = await invitations_repositories.get_total_project_invitations(
            project_slug=project.slug, status=ProjectInvitationStatus.PENDING
        )
    else:
        invitations = await invitations_repositories.get_project_invitations(
            project_slug=project.slug, status=ProjectInvitationStatus.PENDING, user=user, offset=offset, limit=limit
        )
        total_invitations = len(invitations)

    pagination.total = total_invitations

    return pagination, invitations


async def _generate_project_invitation_token(invitation: ProjectInvitation) -> str:
    return str(await ProjectInvitationToken.create_for_object(invitation))


async def send_project_invitation_email(invitation: ProjectInvitation, is_resend: bool | None = False) -> None:
    project = invitation.project
    sender = invitation.resent_by if is_resend else invitation.invited_by
    receiver = invitation.user
    email = receiver.email if receiver else invitation.email
    invitation_token = await _generate_project_invitation_token(invitation)

    context = {
        "invitation_token": invitation_token,
        "project_name": project.name,
        "project_slug": project.slug,
        "project_color": project.color,
        "project_image_url": await get_logo_small_thumbnail_url(project.logo),
        "project_workspace": project.workspace.name,
        "sender_name": sender.full_name if sender else None,
        "receiver_name": receiver.full_name if receiver else None,
    }

    await send_email.defer(
        email_name=Emails.PROJECT_INVITATION.value,
        to=email,
        context=context,
    )


async def _get_time_since_last_send(invitation: ProjectInvitation) -> int:
    last_send_at = invitation.resent_at if invitation.resent_at else invitation.created_at
    return int((aware_utcnow() - last_send_at).total_seconds() / 60)  # in minutes


async def create_project_invitations(
    project: Project, invitations: list[dict[str, str]], invited_by: User
) -> CreateProjectInvitations:
    # create two lists with roles_slug and the emails received (either directly by the invitation's email, or by the
    # invited username's email)
    already_members = 0
    emails: list[str] = []
    emails_roles: list[str] = []
    usernames: list[str] = []
    usernames_roles: list[str] = []
    for i in invitations:
        if i.get("username"):
            usernames.append(i["username"])
            usernames_roles.append(i["role_slug"])

        elif i.get("email"):
            emails.append(i["email"].lower())
            emails_roles.append(i["role_slug"])
    # emails =    ['user1@taiga.demo']  |  emails_roles =    ['general']
    # usernames = ['user3']             |  usernames_roles = ['admin']

    project_roles_dict = await roles_repositories.get_project_roles_as_dict(project=project)
    # project_roles_dict = {'admin': <Role: Administrator>, 'general': <Role: General>}
    project_roles_slugs = project_roles_dict.keys()
    wrong_roles_slugs = set(emails_roles + usernames_roles) - project_roles_slugs
    if wrong_roles_slugs:
        raise ex.NonExistingRoleError(f"These role slugs don't exist: {wrong_roles_slugs}")

    users_emails_dict = await users_repositories.get_users_by_emails_as_dict(emails=emails)
    # users_emails_dict = {'user1@taiga.demo': <User: Norma Fisher>,
    users_usernames_dict = await users_repositories.get_users_by_usernames_as_dict(usernames=usernames)
    # users_usernames_dict = {'user3': <User: Elizabeth Woods>,
    # all usernames should belong to a user; otherwise it's an error
    if len(users_usernames_dict) < len(usernames):
        wrong_usernames = set(usernames) - users_usernames_dict.keys()
        raise ex.NonExistingUsernameError(f"These usernames don't exist: {wrong_usernames}")

    invitations_to_create: dict[str, ProjectInvitation] = {}
    invitations_to_update: dict[str, ProjectInvitation] = {}
    invitations_to_send: dict[str, ProjectInvitation] = {}
    project_members = await roles_repositories.get_project_members(project=project)

    users_dict = users_emails_dict | users_usernames_dict
    # users_dict = {
    #         'user1@taiga.demo': <User: Norma Fisher>,
    #         'user3': <User: Elizabeth Woods>,
    #         'user1': <User: Norma Fisher>
    # }

    for key, role_slug in zip(emails + usernames, emails_roles + usernames_roles):
        #                                 key  |  role_slug
        # =======================================================
        # (1st iteration)   'user1@taiga.demo' |   'general'
        # (2nd iteration)              'user3' |     'admin'

        user = users_dict.get(key)
        if user and user in project_members:
            already_members += 1
            continue
        email = user.email if user else key
        pending_invitation = await invitations_repositories.get_project_invitation_by_email(
            project_slug=project.slug, email=email, status=ProjectInvitationStatus.PENDING
        )
        if pending_invitation:
            pending_invitation.role = project_roles_dict[role_slug]
            pending_invitation.invited_by = invited_by

            # To avoid spam
            time_since_last_send = await _get_time_since_last_send(pending_invitation)
            if (
                pending_invitation.num_emails_sent < settings.PROJECT_INVITATION_RESEND_LIMIT
                and time_since_last_send >= settings.PROJECT_INVITATION_RESEND_TIME
            ):
                pending_invitation.num_emails_sent += 1
                pending_invitation.resent_at = aware_utcnow()
                pending_invitation.resent_by = invited_by
                invitations_to_send[email] = pending_invitation
            invitations_to_update[email] = pending_invitation
        else:
            new_invitation = ProjectInvitation(
                user=user,
                project=project,
                role=project_roles_dict[role_slug],
                email=email,
                invited_by=invited_by,
            )
            invitations_to_create[email] = new_invitation
            invitations_to_send[email] = new_invitation

    if len(invitations_to_update) > 0:
        await invitations_repositories.update_project_invitations(objs=invitations_to_update.values())

    if len(invitations_to_create) > 0:
        await invitations_repositories.create_project_invitations(objs=invitations_to_create.values())

    invitations_to_send_list = invitations_to_send.values()
    for invitation in invitations_to_send_list:
        await send_project_invitation_email(invitation=invitation)

    if invitations_to_send_list:
        await invitations_events.emit_event_when_project_invitations_are_created(
            project=project, invitations=invitations_to_send_list, invited_by=invited_by
        )

    return CreateProjectInvitations(invitations=list(invitations_to_send_list), already_members=already_members)


async def accept_project_invitation(invitation: ProjectInvitation) -> ProjectInvitation:
    if invitation.status == ProjectInvitationStatus.ACCEPTED:
        raise ex.InvitationAlreadyAcceptedError("The invitation has already been accepted")

    if invitation.status == ProjectInvitationStatus.REVOKED:
        raise ex.InvitationRevokedError("The invitation is revoked")

    accepted_invitation = await invitations_repositories.accept_project_invitation(invitation=invitation)

    await roles_repositories.create_project_membership(
        project=invitation.project, role=invitation.role, user=invitation.user
    )
    await invitations_events.emit_event_when_project_invitation_is_accepted(invitation=invitation)

    return accepted_invitation


async def accept_project_invitation_from_token(token: str, user: User) -> ProjectInvitation:
    invitation = await get_project_invitation(token=token)

    if not invitation:
        raise ex.InvitationDoesNotExistError("Invitation does not exist")

    if not is_project_invitation_for_this_user(invitation=invitation, user=user):
        raise ex.InvitationIsNotForThisUserError("Invitation is not for this user")

    if invitation.status == ProjectInvitationStatus.ACCEPTED:
        raise ex.InvitationAlreadyAcceptedError("The invitation has already been accepted")

    if invitation.status == ProjectInvitationStatus.REVOKED:
        raise ex.InvitationRevokedError("The invitation is revoked")

    return await accept_project_invitation(invitation=invitation)


def is_project_invitation_for_this_user(invitation: ProjectInvitation, user: User) -> bool:
    """
    Check if a project invitation if for an specific user
    """
    return emails.are_the_same(user.email, invitation.email)


async def has_pending_project_invitation_for_user(project: Project, user: User) -> bool:
    return await invitations_repositories.has_pending_project_invitation_for_user(user=user, project=project)


async def update_user_projects_invitations(user: User) -> None:
    await invitations_repositories.update_user_projects_invitations(user=user)
    invitations = await invitations_repositories.get_user_projects_invitations(
        user=user, status=ProjectInvitationStatus.PENDING
    )
    await invitations_events.emit_event_when_user_invitations_are_updated(invitations=invitations)


async def resend_project_invitation(invitation: ProjectInvitation, resent_by: User) -> None:
    if invitation.status == ProjectInvitationStatus.ACCEPTED:
        raise ex.InvitationAlreadyAcceptedError("Cannot resend an accepted invitation")

    if invitation.status == ProjectInvitationStatus.REVOKED:
        raise ex.InvitationRevokedError("The invitation has already been revoked")

    # To avoid spam
    time_since_last_send = await _get_time_since_last_send(invitation)
    if (
        invitation.num_emails_sent < settings.PROJECT_INVITATION_RESEND_LIMIT
        and time_since_last_send >= settings.PROJECT_INVITATION_RESEND_TIME
    ):
        await invitations_repositories.resend_project_invitation(invitation=invitation, resent_by=resent_by)

        await send_project_invitation_email(invitation=invitation, is_resend=True)


async def revoke_project_invitation(invitation: ProjectInvitation, revoked_by: User) -> None:
    if invitation.status == ProjectInvitationStatus.ACCEPTED:
        raise ex.InvitationAlreadyAcceptedError("Cannot revoke an accepted invitation")

    if invitation.status == ProjectInvitationStatus.REVOKED:
        raise ex.InvitationRevokedError("The invitation has already been revoked")

    await invitations_repositories.revoke_project_invitation(invitation=invitation, revoked_by=revoked_by)

    await invitations_events.emit_event_when_project_invitation_is_revoked(invitation=invitation)
