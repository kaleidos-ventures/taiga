# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any
from uuid import UUID

from taiga.auth import services as auth_services
from taiga.base.api.pagination import Pagination
from taiga.base.utils import emails
from taiga.base.utils.datetime import aware_utcnow
from taiga.conf import settings
from taiga.emails.emails import Emails
from taiga.emails.tasks import send_email
from taiga.projects.invitations import events as invitations_events
from taiga.projects.invitations import repositories as invitations_repositories
from taiga.projects.invitations.choices import ProjectInvitationStatus
from taiga.projects.invitations.models import ProjectInvitation
from taiga.projects.invitations.schemas import CreateProjectInvitationsSchema, PublicProjectInvitationSchema
from taiga.projects.invitations.services import exceptions as ex
from taiga.projects.invitations.tokens import ProjectInvitationToken
from taiga.projects.memberships import repositories as memberships_repositories
from taiga.projects.projects.models import Project
from taiga.projects.projects.services import get_logo_small_thumbnail_url
from taiga.projects.roles import repositories as pj_roles_repositories
from taiga.projects.roles import services as pj_roles_services
from taiga.tokens.exceptions import TokenError
from taiga.users import services as users_services
from taiga.users.models import AnyUser, User


async def get_project_invitation(token: str) -> ProjectInvitation | None:
    try:
        invitation_token = await ProjectInvitationToken.create(token=token)
    except TokenError:
        raise ex.BadInvitationTokenError("Invalid token")

    return await invitations_repositories.get_project_invitation(
        filters=invitation_token.object_data,
        select_related=["user", "project", "workspace", "role"],
    )


async def get_public_project_invitation(token: str) -> PublicProjectInvitationSchema | None:
    if invitation := await get_project_invitation(token=token):

        return PublicProjectInvitationSchema(
            status=invitation.status,
            email=invitation.email,
            existing_user=invitation.user is not None,
            available_logins=(
                await auth_services.get_available_user_logins(user=invitation.user) if invitation.user else []
            ),
            project=invitation.project,
        )

    return None


async def get_project_invitation_by_username_or_email(
    project_id: UUID, username_or_email: str
) -> ProjectInvitation | None:
    return await invitations_repositories.get_project_invitation(
        filters={"project_id": project_id, "username_or_email": username_or_email},
        select_related=["user", "project", "workspace", "role", "invited_by"],
    )


async def get_project_invitation_by_id(project_id: UUID, id: UUID) -> ProjectInvitation | None:
    return await invitations_repositories.get_project_invitation(
        filters={"project_id": project_id, "id": id},
        select_related=["user", "project", "workspace", "role", "invited_by"],
    )


async def get_paginated_pending_project_invitations(
    project: Project, user: AnyUser, offset: int, limit: int
) -> tuple[Pagination, list[ProjectInvitation]]:
    pagination = Pagination(offset=offset, limit=limit, total=0)

    if user.is_anonymous:
        return pagination, []

    role = await pj_roles_repositories.get_project_role(
        filters={"user_id": user.id, "memberships_project_id": project.id}
    )

    if role and role.is_admin:
        invitations = await invitations_repositories.get_project_invitations(
            filters={"project_id": project.id, "status": ProjectInvitationStatus.PENDING},
            offset=offset,
            limit=limit,
        )
        total_invitations = await invitations_repositories.get_total_project_invitations(
            filters={"project_id": project.id, "status": ProjectInvitationStatus.PENDING},
        )
    else:
        invitations = await invitations_repositories.get_project_invitations(
            filters={"project_id": project.id, "status": ProjectInvitationStatus.PENDING, "user": user},
            offset=offset,
            limit=limit,
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
        "project_id": project.b64id,
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
        lang=receiver.lang if receiver else settings.LANG,
    )


async def _get_time_since_last_send(invitation: ProjectInvitation) -> int:
    last_send_at = invitation.resent_at if invitation.resent_at else invitation.created_at
    return int((aware_utcnow() - last_send_at).total_seconds() / 60)  # in minutes


async def _is_spam(invitation: ProjectInvitation) -> bool:
    time_since_last_send = await _get_time_since_last_send(invitation)
    if (
        invitation.num_emails_sent < settings.PROJECT_INVITATION_RESEND_LIMIT
        and time_since_last_send >= settings.PROJECT_INVITATION_RESEND_TIME
    ):
        return False

    return True


async def create_project_invitations(
    project: Project,
    invitations: list[dict[str, str]],
    invited_by: User,
) -> CreateProjectInvitationsSchema:
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

    project_roles_dict = await pj_roles_services.get_project_roles_as_dict(project=project)
    # project_roles_dict = {'admin': <Role: Administrator>, 'general': <Role: General>}
    project_roles_slugs = project_roles_dict.keys()
    wrong_roles_slugs = set(emails_roles + usernames_roles) - project_roles_slugs
    if wrong_roles_slugs:
        raise ex.NonExistingRoleError(f"These role slugs don't exist: {wrong_roles_slugs}")

    users_emails_dict: dict[str, Any] = {}
    if len(emails) > 0:
        users_emails_dict = await users_services.get_users_emails_as_dict(emails=emails)
    # users_emails_dict = {
    #   'user1@taiga.demo': <User: Norma Fisher>,
    #   'user3@taiga.demo': <User: Elisabeth Woods>,
    # }
    users_usernames_dict: dict[str, Any] = {}
    if len(usernames) > 0:
        users_usernames_dict = await users_services.get_users_usernames_as_dict(usernames=usernames)
        # users_usernames_dict = {
        #   'user3': <User: Elizabeth Woods>,
        # }
        # all usernames should belong to a user; otherwise it's an error
        if len(users_usernames_dict) < len(usernames):
            wrong_usernames = set(usernames) - users_usernames_dict.keys()
            raise ex.NonExistingUsernameError(f"These usernames don't exist: {wrong_usernames}")

    invitations_to_create: dict[str, ProjectInvitation] = {}
    invitations_to_update: dict[str, ProjectInvitation] = {}
    invitations_to_send: dict[str, ProjectInvitation] = {}
    project_members = await memberships_repositories.get_project_members(project=project)

    users_dict = users_emails_dict | users_usernames_dict
    # users_dict = {
    #         'user1@taiga.demo': <User: Norma Fisher>,
    #         'user3': <User: Elizabeth Woods>,
    #         'user3@taiga.demo': <User: Elizabeth Woods>,
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

        invitation = await invitations_repositories.get_project_invitation(
            filters={
                "project_id": project.id,
                "username_or_email": email,
                "statuses": [ProjectInvitationStatus.PENDING, ProjectInvitationStatus.REVOKED],
            },
            select_related=["user", "project", "workspace", "role", "invited_by"],
        )

        if invitation:
            invitation.role = project_roles_dict[role_slug]
            invitation.status = ProjectInvitationStatus.PENDING
            if not await _is_spam(invitation):
                invitation.num_emails_sent += 1
                invitation.resent_at = aware_utcnow()
                invitation.resent_by = invited_by
                invitations_to_send[email] = invitation
            invitations_to_update[email] = invitation
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
        objs = list(invitations_to_update.values())
        await invitations_repositories.bulk_update_project_invitations(
            objs_to_update=invitations_to_update.values(),
            fields_to_update=["role", "num_emails_sent", "resent_at", "resent_by", "status"],
        )

    if len(invitations_to_create) > 0:
        objs = list(invitations_to_create.values())
        await invitations_repositories.create_project_invitations(objs=objs)

    invitations_to_send_list = invitations_to_send.values()
    for invitation in invitations_to_send_list:
        await send_project_invitation_email(invitation=invitation)

    if invitations_to_send_list:
        await invitations_events.emit_event_when_project_invitations_are_created(
            project=project, invitations=invitations_to_send_list
        )

    return CreateProjectInvitationsSchema(invitations=list(invitations_to_send_list), already_members=already_members)


async def accept_project_invitation(invitation: ProjectInvitation) -> ProjectInvitation:
    if invitation.status == ProjectInvitationStatus.ACCEPTED:
        raise ex.InvitationAlreadyAcceptedError("The invitation has already been accepted")

    if invitation.status == ProjectInvitationStatus.REVOKED:
        raise ex.InvitationRevokedError("The invitation is revoked")

    invitation.status = ProjectInvitationStatus.ACCEPTED
    accepted_invitation = await invitations_repositories.update_project_invitation(invitation=invitation)

    await memberships_repositories.create_project_membership(
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
    invitation = await invitations_repositories.get_project_invitation(
        filters={"user": user, "project": project, "status": ProjectInvitationStatus.PENDING}
    )
    return bool(invitation)


async def update_user_projects_invitations(user: User) -> None:
    await invitations_repositories.update_user_projects_invitations(user=user)
    invitations = await invitations_repositories.get_project_invitations(
        filters={"user": user, "status": ProjectInvitationStatus.PENDING},
        select_related=["user", "role", "project", "workspace"],
    )
    await invitations_events.emit_event_when_project_invitations_are_updated(invitations=invitations)


async def resend_project_invitation(invitation: ProjectInvitation, resent_by: User) -> None:
    if invitation.status == ProjectInvitationStatus.ACCEPTED:
        raise ex.InvitationAlreadyAcceptedError("Cannot resend an accepted invitation")

    if invitation.status == ProjectInvitationStatus.REVOKED:
        raise ex.InvitationRevokedError("The invitation has already been revoked")

    if not await _is_spam(invitation):
        invitation.num_emails_sent = +1
        invitation.resent_at = aware_utcnow()
        invitation.resent_by = resent_by
        resent_invitation = await invitations_repositories.update_project_invitation(invitation=invitation)
        await send_project_invitation_email(invitation=resent_invitation, is_resend=True)


async def revoke_project_invitation(invitation: ProjectInvitation, revoked_by: User) -> None:
    if invitation.status == ProjectInvitationStatus.ACCEPTED:
        raise ex.InvitationAlreadyAcceptedError("Cannot revoke an accepted invitation")

    if invitation.status == ProjectInvitationStatus.REVOKED:
        raise ex.InvitationRevokedError("The invitation has already been revoked")

    invitation.status = ProjectInvitationStatus.REVOKED
    invitation.revoked_at = aware_utcnow()
    invitation.revoked_by = revoked_by
    revoked_invitation = await invitations_repositories.update_project_invitation(invitation=invitation)

    await invitations_events.emit_event_when_project_invitation_is_revoked(invitation=revoked_invitation)


async def update_project_invitation(invitation: ProjectInvitation, role_slug: str) -> ProjectInvitation:
    if invitation.status == ProjectInvitationStatus.ACCEPTED:
        raise ex.InvitationAlreadyAcceptedError("Cannot change role in an accepted invitation")

    if invitation.status == ProjectInvitationStatus.REVOKED:
        raise ex.InvitationRevokedError("The invitation has already been revoked")

    project_role = await (
        pj_roles_repositories.get_project_role(filters={"project_id": invitation.project_id, "slug": role_slug})
    )

    if not project_role:
        raise ex.NonExistingRoleError("Role does not exist")

    invitation.role = project_role
    updated_invitation = await invitations_repositories.update_project_invitation(invitation=invitation)
    await invitations_events.emit_event_when_project_invitation_is_updated(invitation=updated_invitation)

    return updated_invitation
