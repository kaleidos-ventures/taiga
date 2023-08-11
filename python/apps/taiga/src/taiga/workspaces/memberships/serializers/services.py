# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC
from taiga.projects.projects.models import Project
from taiga.users.models import User
from taiga.workspaces.memberships.models import WorkspaceMembership
from taiga.workspaces.memberships.serializers import WorkspaceGuestDetailSerializer, WorkspaceMembershipDetailSerializer


def serialize_workspace_membership_detail(
    ws_membership: WorkspaceMembership, projects: list[Project]
) -> WorkspaceMembershipDetailSerializer:
    return WorkspaceMembershipDetailSerializer(
        user=ws_membership.user,
        workspace=ws_membership.workspace,
        projects=projects,
    )


def serialize_workspace_guest_detail(user: User, projects: list[Project]) -> WorkspaceGuestDetailSerializer:
    return WorkspaceGuestDetailSerializer(
        user=user,
        projects=projects,
    )
