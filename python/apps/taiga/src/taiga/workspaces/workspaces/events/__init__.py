# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from taiga.events import events_manager
from taiga.users.models import AnyUser
from taiga.workspaces.workspaces.events.content import DeleteWorkspaceContent
from taiga.workspaces.workspaces.models import Workspace

WORKSPACE_DELETE = "workspaces.delete"


async def emit_event_when_workspace_is_deleted(workspace: Workspace, deleted_by: AnyUser) -> None:
    # for ws-members, both in the home page and in the ws-detail
    await events_manager.publish_on_workspace_channel(
        workspace=workspace,
        type=WORKSPACE_DELETE,
        content=DeleteWorkspaceContent(workspace=workspace.id, name=workspace.name, deleted_by=deleted_by),
    )
