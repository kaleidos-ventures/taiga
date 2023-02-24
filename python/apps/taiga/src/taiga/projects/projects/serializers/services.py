# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.projects.projects.models import Project
from taiga.projects.projects.serializers import ProjectDetailSerializer
from taiga.workspaces.workspaces.serializers.nested import WorkspaceNestedSerializer


def serialize_project_detail(
    project: Project,
    workspace: WorkspaceNestedSerializer,
    user_is_admin: bool,
    user_is_member: bool,
    user_has_pending_invitation: bool,
    user_permissions: list[str],
) -> ProjectDetailSerializer:
    return ProjectDetailSerializer(
        id=project.id,
        name=project.name,
        slug=project.slug,
        description=project.description,
        color=project.color,
        logo=project.logo,
        workspace=workspace,
        user_is_admin=user_is_admin,
        user_is_member=user_is_member,
        user_has_pending_invitation=user_has_pending_invitation,
        user_permissions=user_permissions,
    )
