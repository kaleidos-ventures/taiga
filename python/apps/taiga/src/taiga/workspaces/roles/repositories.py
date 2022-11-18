# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Final
from uuid import UUID

from asgiref.sync import sync_to_async
from taiga.projects.memberships.models import ProjectMembership
from taiga.workspaces.memberships.models import WorkspaceMembership
from taiga.workspaces.roles.models import WorkspaceRole
from taiga.workspaces.workspaces.models import Workspace

WS_ROLE_NAME_ADMIN: Final = "admin"
WS_ROLE_NAME_MEMBER: Final = "member"
WS_ROLE_NAME_GUEST: Final = "guest"
WS_ROLE_NAME_NONE: Final = "none"


def get_user_workspace_role_name_sync(workspace_id: UUID, user_id: UUID | None) -> str:
    if not user_id:
        return WS_ROLE_NAME_NONE

    try:
        membership = WorkspaceMembership.objects.select_related("role").get(workspace_id=workspace_id, user_id=user_id)

        if membership.role.is_admin:
            return WS_ROLE_NAME_ADMIN
        else:
            return WS_ROLE_NAME_MEMBER
    except WorkspaceMembership.DoesNotExist:
        if ProjectMembership.objects.filter(user_id=user_id, project__workspace_id=workspace_id).exists():
            return WS_ROLE_NAME_GUEST
        else:
            return WS_ROLE_NAME_NONE


get_user_workspace_role_name = sync_to_async(get_user_workspace_role_name_sync)


@sync_to_async
def get_workspace_role_for_user(user_id: UUID, workspace_id: UUID) -> WorkspaceRole | None:
    try:
        return WorkspaceRole.objects.get(memberships__user__id=user_id, memberships__workspace__id=workspace_id)
    except WorkspaceRole.DoesNotExist:
        return None


@sync_to_async
def create_workspace_role(
    name: str, slug: str, workspace: Workspace, permissions: list[str] = [], is_admin: bool = False
) -> WorkspaceRole:
    return WorkspaceRole.objects.create(
        workspace=workspace,
        name=name,
        slug=slug,
        permissions=permissions,
        is_admin=is_admin,
    )
