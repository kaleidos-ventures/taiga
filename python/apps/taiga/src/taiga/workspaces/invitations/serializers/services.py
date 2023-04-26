# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from taiga.workspaces.invitations.models import WorkspaceInvitation
from taiga.workspaces.invitations.serializers import CreateWorkspaceInvitationsSerializer


def serialize_create_workspace_invitations(
    invitations: list[WorkspaceInvitation],
    already_members: int,
) -> CreateWorkspaceInvitationsSerializer:
    return CreateWorkspaceInvitationsSerializer(invitations=invitations, already_members=already_members)
