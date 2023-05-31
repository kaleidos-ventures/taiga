# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import TYPE_CHECKING, Literal

from taiga.base.api.permissions import check_permissions
from taiga.base.utils.uuid import decode_b64str_to_uuid
from taiga.events import channels
from taiga.events.responses import ActionResponse
from taiga.exceptions.api import ForbiddenError
from taiga.permissions import CanViewProject
from taiga.projects.projects.models import Project
from taiga.users.models import AnyUser

from .base import Action

if TYPE_CHECKING:
    from taiga.events.subscriber import Subscriber


__all__ = [
    "SubscribeToProjectEventsAction",
    "UnsubscribeFromProjectEventsAction",
    "CheckProjectEventsSubscriptionAction",
]


PROJECT_PERMISSIONS = CanViewProject()


async def can_user_subscribe_to_project_channel(user: AnyUser, project: Project) -> bool:
    try:
        await check_permissions(permissions=PROJECT_PERMISSIONS, user=user, obj=project)
        return True
    except ForbiddenError:
        return False


class SubscribeToProjectEventsAction(Action, type="subscribe_to_project_events"):
    command: Literal["subscribe_to_project_events"] = "subscribe_to_project_events"
    project: str

    async def run(self, subscriber: "Subscriber") -> None:
        from taiga.projects.projects import services as projects_services

        project_id = decode_b64str_to_uuid(self.project)
        project = await projects_services.get_project(id=project_id)

        if project:
            if await can_user_subscribe_to_project_channel(user=subscriber.user, project=project):
                channel = channels.project_channel(self.project)
                content = {"channel": channel}
                await subscriber.subscribe(channel=channel)
                await subscriber.put(ActionResponse(action=self, content=content))
            else:
                # Not enough permissions
                await subscriber.put(ActionResponse(action=self, status="error", content={"detail": "not-allowed"}))
        else:
            # Project does not exist
            await subscriber.put(ActionResponse(action=self, status="error", content={"detail": "not-found"}))


class UnsubscribeFromProjectEventsAction(Action, type="unsubscribe_from_project_events"):
    command: Literal["unsubscribe_from_project_events"] = "unsubscribe_from_project_events"
    project: str

    async def run(self, subscriber: "Subscriber") -> None:
        if subscriber.user.is_authenticated:
            channel = channels.project_channel(self.project)
            ok = await subscriber.unsubscribe(channel=channel)
            if ok:
                await subscriber.put(ActionResponse(action=self))
            else:
                await subscriber.put(ActionResponse(action=self, status="error", content={"detail": "not-subscribe"}))
        else:
            await subscriber.put(ActionResponse(action=self, status="error", content={"detail": "not-allowed"}))


class CheckProjectEventsSubscriptionAction(Action, type="check_project_events_subscription"):
    command: Literal["check_project_events_subscription"] = "check_project_events_subscription"
    project: str

    async def run(self, subscriber: "Subscriber") -> None:
        from taiga.projects.projects import services as projects_services

        project_id = decode_b64str_to_uuid(self.project)
        project = await projects_services.get_project(id=project_id)

        if project and not await can_user_subscribe_to_project_channel(user=subscriber.user, project=project):
            channel = channels.project_channel(self.project)
            await subscriber.unsubscribe(channel=channel)
            await subscriber.put(ActionResponse(action=self, status="error", content={"detail": "lost-permissions"}))
