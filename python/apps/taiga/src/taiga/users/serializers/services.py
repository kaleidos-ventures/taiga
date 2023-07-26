# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from taiga.auth.serializers import AccessTokenWithRefreshSerializer
from taiga.projects.invitations.models import ProjectInvitation
from taiga.projects.projects.models import Project
from taiga.users.serializers import UserDeleteInfoSerializer, VerificationInfoSerializer
from taiga.users.serializers.nested import _WorkspaceWithProjectsNestedSerializer
from taiga.workspaces.invitations.models import WorkspaceInvitation
from taiga.workspaces.workspaces.models import Workspace


def serialize_verification_info(
    auth: AccessTokenWithRefreshSerializer,
    project_invitation: ProjectInvitation | None,
    workspace_invitation: WorkspaceInvitation | None,
) -> VerificationInfoSerializer:
    return VerificationInfoSerializer(
        auth=auth,
        project_invitation=project_invitation,
        workspace_invitation=workspace_invitation,
    )


def serialize_workspace_with_projects_nested(
    workspace: Workspace, projects: list[Project] = []
) -> _WorkspaceWithProjectsNestedSerializer:
    return _WorkspaceWithProjectsNestedSerializer(
        id=workspace.id,
        name=workspace.name,
        slug=workspace.slug,
        color=workspace.color,
        projects=projects,
    )


def serialize_user_delete_info(
    workspaces: list[_WorkspaceWithProjectsNestedSerializer], projects: list[Project] = []
) -> UserDeleteInfoSerializer:
    return UserDeleteInfoSerializer(
        workspaces=workspaces,
        projects=projects,
    )
