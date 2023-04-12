# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC
from taiga.projects.projects.models import Project
from taiga.users.models import User
from taiga.workspaces.memberships.serializers import WorkspaceGuestDetailSerializer, WorkspaceMembershipDetailSerializer
from taiga.workspaces.workspaces.models import Workspace


def serialize_workspace_membership_detail(
    user: User, workspace: Workspace, projects: list[Project]
) -> WorkspaceMembershipDetailSerializer:
    return WorkspaceMembershipDetailSerializer(
        user=user,
        workspace=workspace,
        projects=projects,
    )


def serialize_workspace_guest_detail(user: User, projects: list[Project]) -> WorkspaceGuestDetailSerializer:
    return WorkspaceGuestDetailSerializer(
        user=user,
        projects=projects,
    )
