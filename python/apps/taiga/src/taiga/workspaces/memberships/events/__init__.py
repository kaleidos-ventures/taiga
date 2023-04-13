# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from taiga.events import events_manager
from taiga.workspaces.memberships.events.content import DeleteWorkspaceMembershipContent
from taiga.workspaces.memberships.models import WorkspaceMembership

DELETE_WORKSPACE_MEMBERSHIP = "workspacememberships.delete"


async def emit_event_when_workspace_membership_is_deleted(membership: WorkspaceMembership) -> None:
    await events_manager.publish_on_workspace_channel(
        workspace=membership.workspace,
        type=DELETE_WORKSPACE_MEMBERSHIP,
        content=DeleteWorkspaceMembershipContent(membership=membership),
    )

    await events_manager.publish_on_user_channel(
        user=membership.user,
        type=DELETE_WORKSPACE_MEMBERSHIP,
        content=DeleteWorkspaceMembershipContent(membership=membership),
    )
