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
def get_project_invitations(project_slug: str, status: InvitationStatus) -> list[Invitation]:
    project_invitees = (
        Invitation.objects.select_related("user", "role").filter(project__slug=project_slug, status=status)
        # pending invitations with NULL users will implicitly be listed
        # after invitations with users (and valid full names)
        .order_by("user__full_name")
    )
    return list(project_invitees)


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
