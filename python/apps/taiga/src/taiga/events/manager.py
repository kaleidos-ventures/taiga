# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

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


import itertools
import logging
from asyncio import Queue, create_task
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator, AsyncIterator, Type

from fastapi import WebSocket

from .pubsub import Event, PostgresPubSubBackend, PubSubBackend

logger = logging.getLogger(__name__)


class Subscriber:
    _id_seq = itertools.count(start=1)

    def __init__(self, websocket: WebSocket, queue: Queue[Event | None]) -> None:
        self.id = next(Subscriber._id_seq)
        self.queue = queue
        self.websocket = websocket

    async def __aiter__(self) -> AsyncGenerator[Event, None]:
        try:
            while True:
                yield await self.get()
        except Unsubscribed:
            pass

    def __repr__(self) -> str:
        return f"Sunscriber(id={self.id!r})"

    async def get(self) -> Event:
        event = await self.queue.get()
        if event is None:
            # The connection has finished
            raise Unsubscribed()
        return event


class Unsubscribed(Exception):
    pass


class EventsManager:
    def __init__(self, backend_class: Type[PubSubBackend] = PostgresPubSubBackend, **conn_kwargs: Any):
        self._backend = backend_class(**conn_kwargs)
        self._subscribers: dict[WebSocket, Subscriber] = {}
        self._channels: dict[str, set[Queue[Event | None]]] = {}

    async def __aenter__(self) -> "EventsManager":
        await self.connect()
        return self

    async def __aexit__(self, *args: Any, **kwargs: Any) -> None:
        await self.disconnect()

    async def _listener(self) -> None:
        while True:
            event = await self._backend.next_published()
            queues = list(self._channels.get(event.channel, []))
            for queue in queues:
                await queue.put(event)
            logger.info(
                f"Emit to {len(queues)} subscriber(s): {event}.",
                extra={"action": "manager.emit", "event": event},
            )

    @property
    def is_connected(self) -> bool:
        return self._backend.is_connected

    async def connect(self) -> None:
        await self._backend.connect()
        self._listener_task = create_task(self._listener())
        logger.info(
            "Event manager connected.",
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
        queue: Queue[Event | None] = Queue()

        try:
            subscriber = Subscriber(websocket=websocket, queue=queue)
            self._subscribers[websocket] = subscriber
            logger.info(
                f"Register new WebSocket #{subscriber.id}.",
                extra={"action": "manager.register", "subscriber": subscriber},
            )
            yield subscriber
        finally:  # When the websocket will be disconnected
            del self._subscribers[websocket]
            await queue.put(None)
            logger.info(
                f"Unregister new WebSocket #{subscriber.id}.",
                extra={"action": "manager.unregister", "subscriber": subscriber},
            )

    async def subscribe(self, websocket: WebSocket, channel: str) -> bool:
        subscriber = self._subscribers.get(websocket, None)

        if subscriber:
            if not self._channels.get(channel):
                await self._backend.subscribe(channel)
                self._channels[channel] = set([subscriber.queue])
            else:
                self._channels[channel].add(subscriber.queue)
            logger.info(
                f"Subscribe WebSocket #{subscriber.id} to the channel '{channel}'.",
                extra={"action": "manager.subscribe", "subscriber": subscriber, "channel": channel},
            )
            return True  # The websocket has been subscribed to the channel
        return False  # The websocket is not registered

    async def unsubscribe(self, websocket: WebSocket, channel: str) -> bool:
        subscriber = self._subscribers.get(websocket, None)

        if subscriber:
            self._channels[channel].remove(subscriber.queue)
            if not self._channels.get(channel, None):
                del self._channels[channel]
                await self._backend.unsubscribe(channel)
            logger.info(
                f"Unsubscribe websocket #{subscriber.id} to the channel '{channel}'.",
                extra={"action": "manager.unsubscribe", "subscriber": subscriber, "channel": channel},
            )
            return True  # The websocket has been subscribed to the channel
        return False  # The websocket is not registered

    async def publish(self, channel: str, message: str) -> None:
        logger.info(
            f"Publish to '{channel}': '{message}'.",
            extra={"action": "manager.publish", "channel": channel, "content": message},
        )
        await self._backend.publish(channel, message)
