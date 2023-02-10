# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import TYPE_CHECKING, Literal

from taiga.base.api.permissions import check_permissions
from taiga.base.utils.uuid import decode_b64str_to_uuid
from taiga.events import channels
from taiga.events.responses import ActionResponse
from taiga.exceptions.api import ForbiddenError
from taiga.permissions import HasPerm
from taiga.users.models import AnyUser
from taiga.workspaces.workspaces.models import Workspace

from .base import Action

if TYPE_CHECKING:
    from taiga.events.subscriber import Subscriber


__all__ = [
    "SubscribeToWorkspaceEventsAction",
    "UnsubscribeFromWorkspaceEventsAction",
    "CheckWorkspaceEventsSubscriptionAction",
]


WORKSPACE_PERMISSIONS = HasPerm("view_workspace")


async def can_user_subscribe_to_workspace_channel(user: AnyUser, workspace: Workspace) -> bool:
    try:
        await check_permissions(permissions=WORKSPACE_PERMISSIONS, user=user, obj=workspace)
        return True
    except ForbiddenError:
        return False


class SubscribeToWorkspaceEventsAction(Action, type="subscribe_to_workspace_events"):
    command: Literal["subscribe_to_workspace_events"] = "subscribe_to_workspace_events"
    workspace: str

    async def run(self, subscriber: "Subscriber") -> None:
        from taiga.workspaces.workspaces import services as workspaces_services

        workspace_id = decode_b64str_to_uuid(self.workspace)
        workspace = await workspaces_services.get_workspace(id=workspace_id)

        if workspace:
            if await can_user_subscribe_to_workspace_channel(user=subscriber.user, workspace=workspace):
                channel = channels.workspace_channel(self.workspace)
                content = {"channel": channel}
                await subscriber.subscribe(channel=channel)
                await subscriber.put(ActionResponse(action=self, content=content))
            else:
                # Not enought permissions
                await subscriber.put(ActionResponse(action=self, status="error", content={"detail": "not-allowed"}))
        else:
            # Workspace does not exist
            await subscriber.put(ActionResponse(action=self, status="error", content={"detail": "not-found"}))


class UnsubscribeFromWorkspaceEventsAction(Action, type="unsubscribe_from_workspace_events"):
    command: Literal["unsubscribe_from_workspace_events"] = "unsubscribe_from_workspace_events"
    workspace: str

    async def run(self, subscriber: "Subscriber") -> None:
        if subscriber.user.is_authenticated:
            channel = channels.workspace_channel(self.workspace)
            ok = await subscriber.unsubscribe(channel=channel)
            if ok:
                await subscriber.put(ActionResponse(action=self))
            else:
                await subscriber.put(ActionResponse(action=self, status="error", content={"detail": "not-subscribe"}))
        else:
            await subscriber.put(ActionResponse(action=self, status="error", content={"detail": "not-allowed"}))


class CheckWorkspaceEventsSubscriptionAction(Action, type="check_workspace_events_subscription"):
    command: Literal["check_workspace_events_subscription"] = "check_workspace_events_subscription"
    workspace: str

    async def run(self, subscriber: "Subscriber") -> None:
        from taiga.workspaces.workspaces import services as workspaces_services

        workspace_id = decode_b64str_to_uuid(self.workspace)
        workspace = await workspaces_services.get_workspace(id=workspace_id)

        if workspace and not await can_user_subscribe_to_workspace_channel(user=subscriber.user, workspace=workspace):
            channel = channels.workspace_channel(self.workspace)
            await subscriber.unsubscribe(channel=channel)
            await subscriber.put(ActionResponse(action=self, status="error", content={"detail": "lost-permissions"}))
