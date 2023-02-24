# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.workspaces.workspaces.models import Workspace
from taiga.workspaces.workspaces.serializers import WorkspaceDetailSerializer, WorkspaceSerializer
from taiga.workspaces.workspaces.serializers.nested import WorkspaceNestedSerializer


def serialize_workspace(workspace: Workspace, user_role: str, total_projects: str) -> WorkspaceSerializer:
    return WorkspaceSerializer(
        id=workspace.id,
        name=workspace.name,
        slug=workspace.slug,
        color=workspace.color,
        total_projects=total_projects,
        has_projects=workspace.has_projects,  # type: ignore[attr-defined]
        is_premium=workspace.is_premium,
        user_role=user_role,
        user_is_owner=workspace.user_is_owner,  # type: ignore[attr-defined]
    )


def serialize_workspace_detail(workspace: Workspace) -> WorkspaceDetailSerializer:
    return WorkspaceDetailSerializer(
        id=workspace.id,
        name=workspace.name,
        slug=workspace.slug,
        color=workspace.color,
        latest_projects=workspace.latest_projects,  # type: ignore[attr-defined]
        invited_projects=workspace.invited_projects,  # type: ignore[attr-defined]
        total_projects=workspace.total_projects,  # type: ignore[attr-defined]
        has_projects=workspace.has_projects,  # type: ignore[attr-defined]
        is_premium=workspace.is_premium,
        user_role=workspace.user_role,  # type: ignore[attr-defined]
        user_is_owner=workspace.user_is_owner,  # type: ignore[attr-defined]
    )


def serialize_nested(workspace: Workspace, user_role: str) -> WorkspaceNestedSerializer:
    return WorkspaceNestedSerializer(
        id=workspace.id,
        name=workspace.name,
        slug=workspace.slug,
        user_role=user_role,
        is_premium=workspace.is_premium,
    )
