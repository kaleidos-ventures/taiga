# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Final
from uuid import UUID

from taiga.base.api import Pagination
from taiga.projects.memberships import repositories as projects_memberships_repositories
from taiga.projects.projects import repositories as projects_repositories
from taiga.workspaces.memberships import repositories as workspace_memberships_repositories
from taiga.workspaces.memberships.serializers import WorkspaceMembershipDetailSerializer
from taiga.workspaces.memberships.serializers import services as serializer_services
from taiga.workspaces.workspaces.models import Workspace

WS_ROLE_NAME_ADMIN: Final = "admin"
WS_ROLE_NAME_GUEST: Final = "guest"
WS_ROLE_NAME_NONE: Final = "none"


##########################################################
# list workspace memberships
##########################################################


async def list_paginated_workspace_memberships(
    workspace: Workspace, offset: int, limit: int
) -> tuple[Pagination, list[WorkspaceMembershipDetailSerializer]]:
    ws_memberships = await workspace_memberships_repositories.list_workspace_memberships(
        filters={"workspace_id": workspace.id},
        select_related=["user", "workspace"],
        offset=offset,
        limit=limit,
    )
    total_memberships = await workspace_memberships_repositories.get_total_workspace_memberships(
        filters={"workspace_id": workspace.id}
    )
    pagination = Pagination(offset=offset, limit=limit, total=total_memberships)
    serialized_memberships = [
        serializer_services.serialize_workspace_membership_detail(
            user=ws_membership.user,
            workspace=ws_membership.workspace,
            projects=await projects_repositories.list_projects(
                filters={"workspace_id": ws_membership.workspace.id, "project_member_id": ws_membership.user.id},
            ),
        )
        for ws_membership in ws_memberships
    ]

    return pagination, serialized_memberships


##########################################################
# misc
##########################################################


async def get_workspace_role_name(
    workspace_id: UUID,
    user_id: UUID | None,
) -> str:
    if not user_id:
        return WS_ROLE_NAME_NONE

    ws_membership = await workspace_memberships_repositories.get_workspace_membership(
        filters={"workspace_id": workspace_id, "user_id": user_id},
    )
    if ws_membership:
        return WS_ROLE_NAME_ADMIN

    else:
        pj_membership = await projects_memberships_repositories.exist_project_membership(
            filters={"user_id": user_id, "project__workspace_id": workspace_id}
        )
        if pj_membership:
            return WS_ROLE_NAME_GUEST
        else:
            return WS_ROLE_NAME_NONE
