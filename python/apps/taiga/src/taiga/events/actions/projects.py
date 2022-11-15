# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import TYPE_CHECKING, Literal

from taiga.base.api.permissions import Or, check_permissions
from taiga.events import channels
from taiga.events.responses import ActionResponse
from taiga.exceptions.api import ForbiddenError
from taiga.permissions import CanViewProject
from taiga.projects.invitations.permissions import HasPendingProjectInvitation

from .base import Action

if TYPE_CHECKING:
    from taiga.events.subscriber import Subscriber


__all__ = ["SubscribeToProjectEventsAction", "UnsubscribeFromProjectEventsAction"]


PROJECT_PERMISSIONS = Or(CanViewProject(), HasPendingProjectInvitation())


class SubscribeToProjectEventsAction(Action, type="subscribe_to_project_events"):
    command: Literal["subscribe_to_project_events"] = "subscribe_to_project_events"
    project: str

    async def run(self, subscriber: "Subscriber") -> None:
        from taiga.projects.projects import services as projects_services

        project = await projects_services.get_project(slug=self.project)

        if project:
            try:
                await check_permissions(permissions=PROJECT_PERMISSIONS, user=subscriber.user, obj=project)
                channel = channels.project_channel(self.project)
                content = {"channel": channel}
                await subscriber.subscribe(channel=channel)
                await subscriber.put(ActionResponse(action=self, content=content))
            except ForbiddenError:
                # Not enought permissions
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
