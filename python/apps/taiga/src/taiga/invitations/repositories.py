# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from asgiref.sync import sync_to_async
from django.db.models import Q
from taiga.base.utils.datetime import aware_utcnow
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
        return Invitation.objects.select_related("user", "project", "project__workspace", "role", "invited_by").get(
            project__slug=project_slug, email__iexact=email, status=status
        )
    except Invitation.DoesNotExist:
        return None


@sync_to_async
def get_project_invitation_by_username_or_email(
    project_slug: str, username_or_email: str, status: InvitationStatus | None = None
) -> Invitation | None:
    by_user = Q(user__username__iexact=username_or_email) | Q(user__email__iexact=username_or_email)
    by_email = Q(user__isnull=True, email__iexact=username_or_email)
    by_project = Q(project__slug=project_slug)
    qs_filter = by_project & (by_user | by_email)
    if status:
        qs_filter = Q(status=status) & qs_filter

    try:
        return Invitation.objects.select_related("user", "project", "project__workspace", "role", "invited_by").get(
            qs_filter
        )
    except Invitation.DoesNotExist:
        return None


@sync_to_async
def get_project_invitations(
    project_slug: str, offset: int = 0, limit: int = 0, user: User | None = None, status: InvitationStatus | None = None
) -> list[Invitation]:
    project_invitees_qs = (
        Invitation.objects.select_related("user", "role").filter(project__slug=project_slug)
        # pending invitations for NULL users will be listed after invitations for existing users (with a fullname)
        .order_by("user__full_name", "email")
    )

    if status:
        project_invitees_qs &= project_invitees_qs.filter(status=status)

    if user:
        same_user_id = Q(user_id=user.id)
        same_user_email = Q(user__isnull=True, email__iexact=user.email)
        # the invitation may be outdated, and the initially unregistered user may have (by other means) become a user
        project_invitees_qs &= project_invitees_qs.filter(same_user_id | same_user_email)

    if limit:
        project_invitees_qs = project_invitees_qs[offset : offset + limit]

    return list(project_invitees_qs)


@sync_to_async
def get_total_project_invitations(project_slug: str, status: InvitationStatus | None = None) -> int:
    project_invitees_qs = Invitation.objects.filter(project__slug=project_slug)

    if status:
        project_invitees_qs &= project_invitees_qs.filter(status=status)

    return project_invitees_qs.count()


@sync_to_async
def get_user_projects_invitations(user: User, status: InvitationStatus | None = None) -> list[Invitation]:
    """
    All project invitations of a given user, in an optional given status
    """
    qs = Invitation.objects.select_related("user", "project").filter(user=user)
    if status:
        qs &= qs.filter(status=status)

    return list(qs)


@sync_to_async
def accept_project_invitation(invitation: Invitation) -> Invitation:
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


@sync_to_async
def update_user_projects_invitations(user: User) -> None:
    Invitation.objects.filter(email=user.email).update(user=user)


@sync_to_async
def resend_project_invitation(invitation: Invitation, resent_by: User) -> Invitation:
    invitation.num_emails_sent += 1
    invitation.resent_at = aware_utcnow()
    invitation.resent_by = resent_by
    invitation.save()
    return invitation


@sync_to_async
def revoke_project_invitation(invitation: Invitation, revoked_by: User) -> Invitation:
    invitation.status = InvitationStatus.REVOKED
    invitation.revoked_at = aware_utcnow()
    invitation.revoked_by = revoked_by
    invitation.save()
    return invitation
