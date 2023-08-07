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
from taiga.users import repositories as users_repositories
from taiga.workspaces.invitations import repositories as workspace_invitations_repositories
from taiga.workspaces.memberships import events as workspace_memberships_events
from taiga.workspaces.memberships import repositories as workspace_memberships_repositories
from taiga.workspaces.memberships.models import WorkspaceMembership
from taiga.workspaces.memberships.serializers import WorkspaceGuestDetailSerializer, WorkspaceMembershipDetailSerializer
from taiga.workspaces.memberships.serializers import services as serializer_services
from taiga.workspaces.memberships.services import exceptions as ex
from taiga.workspaces.workspaces.models import Workspace

##########################################################
# list workspace memberships
##########################################################


async def list_workspace_memberships(
    workspace: Workspace,
) -> list[WorkspaceMembershipDetailSerializer]:
    ws_memberships = await workspace_memberships_repositories.list_workspace_memberships(
        filters={"workspace_id": workspace.id},
        select_related=["user", "workspace"],
    )
    return [
        serializer_services.serialize_workspace_membership_detail(
            ws_membership=ws_membership,
            projects=await projects_repositories.list_projects(
                filters={"workspace_id": ws_membership.workspace_id, "project_member_id": ws_membership.user_id},
            ),
        )
        for ws_membership in ws_memberships
    ]


##########################################################
# list workspace guests
##########################################################


async def list_paginated_workspace_guests(
    workspace: Workspace, offset: int, limit: int
) -> tuple[Pagination, list[WorkspaceGuestDetailSerializer]]:
    ws_guests = await users_repositories.list_users(
        filters={"guests_in_workspace": workspace},
        offset=offset,
        limit=limit,
    )
    total_guests = await users_repositories.get_total_users(
        filters={"guests_in_workspace": workspace},
    )
    pagination = Pagination(offset=offset, limit=limit, total=total_guests)
    serialized_guests = [
        serializer_services.serialize_workspace_guest_detail(
            user=ws_guest,
            projects=await projects_repositories.list_projects(
                filters={"workspace_id": workspace.id, "project_member_id": ws_guest.id},
            ),
        )
        for ws_guest in ws_guests
    ]

    return pagination, serialized_guests


##########################################################
# get workspace membership
##########################################################


async def get_workspace_membership(
    workspace_id: UUID,
    username: str,
) -> WorkspaceMembership | None:
    return await workspace_memberships_repositories.get_workspace_membership(
        filters={"workspace_id": workspace_id, "username": username}, select_related=["workspace", "user"]
    )


##########################################################
# delete workspace membership
##########################################################


async def delete_workspace_membership(
    membership: WorkspaceMembership,
) -> bool:
    workspace_total_members = await workspace_memberships_repositories.get_total_workspace_memberships(
        filters={"workspace_id": membership.workspace_id},
    )
    if workspace_total_members == 1:
        raise ex.MembershipIsTheOnlyMemberError("Membership is the only member")

    deleted = await workspace_memberships_repositories.delete_workspace_memberships(
        filters={"id": membership.id},
    )
    if deleted > 0:
        # Delete workspace invitations
        await workspace_invitations_repositories.delete_workspace_invitation(
            filters={"workspace_id": membership.workspace_id, "username_or_email": membership.user.email},
        )
        await workspace_memberships_events.emit_event_when_workspace_membership_is_deleted(membership=membership)
        return True

    return False


##########################################################
# misc
##########################################################

WS_ROLE_NAME_MEMBER: Final = "member"
WS_ROLE_NAME_GUEST: Final = "guest"
WS_ROLE_NAME_NONE: Final = "none"


async def get_workspace_role_name(
    workspace_id: UUID,
    user_id: UUID | None,
) -> str:
    if not user_id:
        return WS_ROLE_NAME_NONE

    if await workspace_memberships_repositories.get_workspace_membership(
        filters={"workspace_id": workspace_id, "user_id": user_id},
    ):
        return WS_ROLE_NAME_MEMBER
    elif await projects_memberships_repositories.exist_project_membership(
        filters={"user_id": user_id, "workspace_id": workspace_id}
    ):
        return WS_ROLE_NAME_GUEST
    return WS_ROLE_NAME_NONE
