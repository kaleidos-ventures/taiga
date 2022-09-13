# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from uuid import UUID

from asgiref.sync import sync_to_async
from taiga.base.db.models import Q
from taiga.base.utils.datetime import aware_utcnow
from taiga.invitations.choices import ProjectInvitationStatus
from taiga.invitations.models import ProjectInvitation
from taiga.projects.models import Project
from taiga.roles.models import ProjectRole
from taiga.users.models import User


@sync_to_async
def get_project_invitation(id: str | UUID) -> ProjectInvitation | None:
    try:
        return ProjectInvitation.objects.select_related("user", "project", "project__workspace", "role").get(id=id)
    except ProjectInvitation.DoesNotExist:
        return None


@sync_to_async
def get_project_invitation_by_username_or_email(
    project_slug: str, username_or_email: str, statuses: list[ProjectInvitationStatus] = []
) -> ProjectInvitation | None:
    by_user = Q(user__username__iexact=username_or_email) | Q(user__email__iexact=username_or_email)
    by_email = Q(user__isnull=True, email__iexact=username_or_email)
    by_project = Q(project__slug=project_slug)
    qs_filter = by_project & (by_user | by_email)
    if statuses:
        qs_filter = Q(status__in=statuses) & qs_filter

    try:
        return ProjectInvitation.objects.select_related(
            "user", "project", "project__workspace", "role", "invited_by"
        ).get(qs_filter)
    except ProjectInvitation.DoesNotExist:
        return None


@sync_to_async
def get_project_invitation_by_id(project_slug: str, id: UUID) -> ProjectInvitation | None:
    try:
        return ProjectInvitation.objects.select_related(
            "user", "project", "project__workspace", "role", "invited_by"
        ).get(id=id, project__slug=project_slug)
    except ProjectInvitation.DoesNotExist:
        return None


@sync_to_async
def get_project_invitations(
    project_slug: str,
    offset: int = 0,
    limit: int = 0,
    user: User | None = None,
    status: ProjectInvitationStatus | None = None,
) -> list[ProjectInvitation]:
    project_invitees_qs = (
        ProjectInvitation.objects.select_related("user", "role").filter(project__slug=project_slug)
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
def get_total_project_invitations(project_slug: str, status: ProjectInvitationStatus | None = None) -> int:
    project_invitees_qs = ProjectInvitation.objects.filter(project__slug=project_slug)

    if status:
        project_invitees_qs &= project_invitees_qs.filter(status=status)

    return project_invitees_qs.count()


@sync_to_async
def get_project_invitation_by_user(project_slug: str, user: User) -> ProjectInvitation | None:
    is_pending = Q(status=ProjectInvitationStatus.PENDING)
    same_project = Q(project__slug=project_slug)
    same_user_id = Q(user_id=user.id)
    same_user_email = Q(user__isnull=True) & Q(email__iexact=user.email)

    # the invitation may be outdated, and the initially unregistered user may have (by other means) become a user
    try:
        return ProjectInvitation.objects.select_related("user", "role", "project").get(
            is_pending, same_project, same_user_id | same_user_email
        )
    except ProjectInvitation.DoesNotExist:
        return None


@sync_to_async
def get_user_projects_invitations(user: User, status: ProjectInvitationStatus | None = None) -> list[ProjectInvitation]:
    """
    All project invitations of a given user, in an optional given status
    """
    qs = ProjectInvitation.objects.select_related("user", "project", "project__workspace").filter(user=user)
    if status:
        qs &= qs.filter(status=status)

    return list(qs)


@sync_to_async
def accept_project_invitation(invitation: ProjectInvitation) -> ProjectInvitation:
    invitation.status = ProjectInvitationStatus.ACCEPTED
    invitation.save()
    return invitation


@sync_to_async
def create_project_invitations(objs: list[ProjectInvitation]) -> list[ProjectInvitation]:
    return ProjectInvitation.objects.select_related("user", "project", "project__workspace").bulk_create(objs=objs)


@sync_to_async
def update_project_invitations(objs: list[ProjectInvitation]) -> int:
    return ProjectInvitation.objects.select_related("user", "project", "project__workspace").bulk_update(
        objs=objs, fields=["role", "invited_by", "num_emails_sent", "resent_at", "resent_by", "status"]
    )


@sync_to_async
def has_pending_project_invitation_for_user(user: User, project: Project) -> bool:
    return (
        ProjectInvitation.objects.filter(project_id=project.id)
        .filter(status=ProjectInvitationStatus.PENDING)
        .filter(Q(user_id=user.id) | Q(user__isnull=True, email__iexact=user.email))
        .exists()
    )


@sync_to_async
def update_user_projects_invitations(user: User) -> None:
    ProjectInvitation.objects.filter(email=user.email).update(user=user)


@sync_to_async
def resend_project_invitation(invitation: ProjectInvitation, resent_by: User) -> ProjectInvitation:
    invitation.num_emails_sent += 1
    invitation.resent_at = aware_utcnow()
    invitation.resent_by = resent_by
    invitation.save()
    return invitation


@sync_to_async
def revoke_project_invitation(invitation: ProjectInvitation, revoked_by: User) -> ProjectInvitation:
    invitation.status = ProjectInvitationStatus.REVOKED
    invitation.revoked_at = aware_utcnow()
    invitation.revoked_by = revoked_by
    invitation.save()
    return invitation


@sync_to_async
def update_project_invitation(invitation: ProjectInvitation, role: ProjectRole) -> ProjectInvitation:
    invitation.role = role
    invitation.save()

    return invitation
