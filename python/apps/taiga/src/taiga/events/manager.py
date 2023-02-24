# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

# The code is partially taken (and modified) from brodcaster v. 0.2.0
# (https://github.com/encode/broadcaster/tree/435c35eefcf54192331a44881caf626a5993b2f0)
# that is licensed under the following terms:
#
# Copyright © 2020, Encode OSS Ltd. All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions
# are met:
#
#     Redistributions of source code must retain the above copyright
#     notice, this list of conditions and the following disclaimer.
#
#     Redistributions in binary form must reproduce the above copyright
#     notice, this list of conditions and the following disclaimer in
#     the documentation and/or other materials provided with the
#     distribution.
#
#     Neither the name of the copyright holder nor the names of its
#     contributors may be used to endorse or promote products derived
#     from this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
# FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
# COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
# INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
# BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
# CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
# LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
# ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
# POSSIBILITY OF SUCH DAMAGE.


import logging
import sys
from asyncio import create_task
from contextlib import asynccontextmanager
from typing import Any, AsyncIterator

from fastapi import WebSocket
from taiga.base.utils.tests import is_test_running
from taiga.conf import settings
from taiga.conf.events import PubSubBackendChoices
from taiga.events import channels, pubsub
from taiga.events.events import Event, EventContent
from taiga.events.responses import EventResponse
from taiga.events.subscriber import Subscriber
from taiga.projects.projects.models import Project
from taiga.users.models import User
from taiga.workspaces.workspaces.models import Workspace

logger = logging.getLogger(__name__)


class EventsManager:
    def __init__(self, backend: pubsub.PubSubBackend, **conn_kwargs: Any):
        self._backend = backend
        self._subscribers: dict[int, Subscriber] = {}
        self._channels: dict[str, set[Subscriber]] = {}

    async def __aenter__(self) -> "EventsManager":
        await self.connect()
        return self

    async def __aexit__(self, *args: Any, **kwargs: Any) -> None:
        try:
            await self.disconnect()
        except pubsub.PubSubBackendIsNotConnected:
            pass

    async def _listener(self) -> None:
        while True:
            channel, event = await self._backend.next_published()
            response = EventResponse(channel=channel, event=event)

            subscribers = list(self._channels.get(channel, []))
            for subscriber in subscribers:
                await subscriber.put(response)

            logger.info(
                f"Emit to {len(subscribers)} subscriber(s): {event}.",
                extra={"action": "manager.emit", "event": event, "total_shipments": len(subscribers)},
            )

    @property
    def is_connected(self) -> bool:
        return self._backend.is_connected

    async def connect(self) -> None:
        await self._backend.connect()
        self._listener_task = create_task(self._listener())

        logger.info(
            f"Event manager connected: {self._backend.__class__.__name__}",
            extra={"action": "manager.connect"},
        )

    async def disconnect(self) -> None:
        if self._listener_task.done():
            self._listener_task.result()
        else:
            self._listener_task.cancel()

        await self._backend.disconnect()

        logger.info(
            "Event manager disconnected.",
            extra={"action": "manager.disconnect"},
        )

    @asynccontextmanager
    async def register(self, websocket: WebSocket) -> AsyncIterator[Subscriber]:
        await websocket.accept()

        subscriber = Subscriber(manager=self, websocket=websocket)
        self._subscribers[subscriber.id] = subscriber

        try:
            logger.info(
                f"Register new WebSocket #{subscriber.id}.",
                extra={"action": "manager.register", "subscriber": subscriber},
            )

            yield subscriber
        finally:  # When the websocket will be disconnected
            del self._subscribers[subscriber.id]
            # TODO: FIXME: Clean self._channels, remove Subscriber instance from every subscribed channel.
            await subscriber.close()

            logger.info(
                f"Unregister new WebSocket #{subscriber.id}.",
                extra={"action": "manager.unregister", "subscriber": subscriber},
            )

    async def subscribe(self, subscriber: Subscriber, channel: str) -> None:
        if not self._channels.get(channel):
            await self._backend.subscribe(channel)
            self._channels[channel] = set([subscriber])
        else:
            self._channels[channel].add(subscriber)

        logger.info(
            f"Subscribe WebSocket #{subscriber.id} to the channel '{channel}'.",
            extra={"action": "manager.subscribe", "subscriber": subscriber, "channel": channel},
        )

    async def unsubscribe(self, subscriber: Subscriber, channel: str) -> bool:
        if channel in self._channels:
            try:
                self._channels[channel].remove(subscriber)
            except KeyError:
                # The subscriber is not subscribed
                return False

            if not self._channels.get(channel, None):
                del self._channels[channel]
                await self._backend.unsubscribe(channel)

            logger.info(
                f"Unsubscribe websocket #{subscriber.id} to the channel '{channel}'.",
                extra={"action": "manager.unsubscribe", "subscriber": subscriber, "channel": channel},
            )
            return True
        return False

    async def publish(self, channel: str, event: Event) -> None:
        await self._backend.publish(channel, event)

        logger.info(
            f"Publish to '{channel}': '{event}'.",
            extra={"action": "manager.publish", "channel": channel, "event": event},
        )

    def _generate_event(self, type: str, content: EventContent = None) -> Event:
        return Event(
            type=type,
            content=content.dict(by_alias=True) if content else None,
        )

    async def publish_on_system_channel(self, type: str, content: EventContent) -> None:
        channel = channels.system_channel()
        event = self._generate_event(type=type, content=content)
        await self.publish(channel=channel, event=event)

    async def publish_on_user_channel(self, user: User | str, type: str, content: EventContent = None) -> None:
        channel = channels.user_channel(user)
        event = self._generate_event(type=type, content=content)
        await self.publish(channel=channel, event=event)

    async def publish_on_project_channel(self, project: Project | str, type: str, content: EventContent = None) -> None:
        channel = channels.project_channel(project)
        event = self._generate_event(type=type, content=content)
        await self.publish(channel=channel, event=event)

    async def publish_on_workspace_channel(
        self,
        workspace: Workspace | str,
        type: str,
        content: EventContent = None,
    ) -> None:
        channel = channels.workspace_channel(workspace)
        event = self._generate_event(type=type, content=content)
        await self.publish(channel=channel, event=event)


def initialize_manager() -> EventsManager:
    def _setup_pubsub_backend() -> pubsub.PubSubBackend:
        match settings.EVENTS.PUBSUB_BACKEND:
            case PubSubBackendChoices.REDIS:
                return pubsub.RedisPubSubBackend(
                    host=settings.EVENTS.REDIS_HOST,
                    port=settings.EVENTS.REDIS_PORT,
                    username=settings.EVENTS.REDIS_USERNAME,
                    password=settings.EVENTS.REDIS_PASSWORD,
                    db=settings.EVENTS.REDIS_DATABASE,
                )
            case _:  # PubSubBackendChoices..MEMORY
                return pubsub.MemoryPubSubBackend()

    try:
        if is_test_running():
            backend: pubsub.PubSubBackend = pubsub.MemoryPubSubBackend()
        else:
            backend = _setup_pubsub_backend()
    except pubsub.PubSubBackendIsNotConnected as e:
        logger.error(f"Error initializing the PubSub backend: {e}")
        sys.exit(-1)

    return EventsManager(backend=backend)


manager = initialize_manager()
