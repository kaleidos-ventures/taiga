# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from asgiref.sync import sync_to_async
from django.db.models import Q
from taiga.invitations.choices import InvitationStatus
from taiga.invitations.models import Invitation
from taiga.projects.models import Project
from taiga.users.models import User


@sync_to_async
def get_project_invitation(id: int) -> Invitation | None:
    try:
        return Invitation.objects.select_related("user", "project", "role").get(id=id)
    except Invitation.DoesNotExist:
        return None


@sync_to_async
def get_project_invitation_by_email(project_slug: str, email: str, status: InvitationStatus) -> Invitation | None:
    try:
        return Invitation.objects.get(project__slug=project_slug, email__iexact=email, status=status)
    except Invitation.DoesNotExist:
        return None


@sync_to_async
def get_project_invitations(
    project_slug: str, user: User | None = None, status: InvitationStatus | None = None
) -> list[Invitation]:
    project_invitees_qs = (
        Invitation.objects.select_related("user", "role").filter(project__slug=project_slug)
        # pending invitations for NULL users will be listed after invitations for existing users (with a fullname)
        .order_by("user__full_name")
    )

    if status:
        project_invitees_qs &= project_invitees_qs.filter(status=status)

    if user:
        same_user_id = Q(user_id=user.id)
        same_user_email = Q(user__isnull=True, email__iexact=user.email)
        # the invitation may be outdated, and the initially unregistered user may have (by other means) become a user
        project_invitees_qs &= project_invitees_qs.filter(same_user_id | same_user_email)

    return list(project_invitees_qs)


@sync_to_async
def get_project_invitation_by_user(project_slug: str, user: User) -> Invitation | None:
    is_pending = Q(status=InvitationStatus.PENDING)
    same_project = Q(project__slug=project_slug)
    same_user_id = Q(user_id=user.id)
    same_user_email = Q(user__isnull=True) & Q(email__iexact=user.email)

    # the invitation may be outdated, and the initially unregistered user may have (by other means) become a user
    try:
        return Invitation.objects.select_related("user", "role", "project").get(
            is_pending, same_project, same_user_id | same_user_email
        )
    except Invitation.DoesNotExist:
        return None


@sync_to_async
def accept_project_invitation(invitation: Invitation, user: User) -> Invitation:
    invitation.user = user
    invitation.status = InvitationStatus.ACCEPTED
    invitation.save()
    return invitation


@sync_to_async
def create_invitations(objs: list[Invitation]) -> list[Invitation]:
    return Invitation.objects.select_related("user", "project").bulk_create(objs=objs)


@sync_to_async
def update_invitations(objs: list[Invitation]) -> int:
    return Invitation.objects.select_related("user", "project").bulk_update(
        objs=objs, fields=["role", "invited_by", "num_emails_sent"]
    )


@sync_to_async
def has_pending_project_invitation_for_user(user: User, project: Project) -> bool:
    return (
        Invitation.objects.filter(project_id=project.id)
        .filter(status=InvitationStatus.PENDING)
        .filter(Q(user_id=user.id) | Q(user__isnull=True, email__iexact=user.email))
        .exists()
    )
