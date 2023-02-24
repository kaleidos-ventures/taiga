# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from taiga.projects.invitations.models import ProjectInvitation
from taiga.projects.invitations.serializers import CreateProjectInvitationsSerializer, PublicProjectInvitationSerializer


def serialize_create_project_invitations(
    invitations: list[ProjectInvitation],
    already_members: int,
) -> CreateProjectInvitationsSerializer:
    return CreateProjectInvitationsSerializer(invitations=invitations, already_members=already_members)


def serialize_public_project_invitation(
    invitation: ProjectInvitation,
    available_logins: list[str],
) -> PublicProjectInvitationSerializer:
    return PublicProjectInvitationSerializer(
        status=invitation.status,
        email=invitation.email,
        existing_user=invitation.user is not None,
        available_logins=available_logins,
        project=invitation.project,
    )
