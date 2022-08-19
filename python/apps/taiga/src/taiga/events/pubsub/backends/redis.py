# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import asyncio
import logging
from typing import Any

from pydantic import ValidationError
from redis import ConnectionError
from redis.asyncio.client import PubSub, Redis
from taiga.events.events import Event

from .base import PubSubBackend, connected
from .exceptions import PubSubBackendIsNotConnected

logger = logging.getLogger(__name__)


class RedisPubSubBackend(PubSubBackend):
    _conn_args: dict[str, Any]
    _conn: "Redis[bytes]"  # https://github.com/python/typeshed/issues/8242
    _pubsub: PubSub
    _subscribed_event: asyncio.Event

    def __init__(self, **conn_kwargs: Any) -> None:
        self._conn_args = conn_kwargs.copy()

    @property
    def is_connected(self) -> bool:
        conn = getattr(self, "_conn", None)
        return conn is not None and hasattr(conn, "connection")

    async def connect(self) -> None:
        try:
            self._conn = Redis(**self._conn_args)
            await self._conn.ping()
        except ConnectionError as e:
            del self._conn
            raise PubSubBackendIsNotConnected(e)

        self._pubsub = self._conn.pubsub()
        self._subscribed_event = asyncio.Event()

    @connected
    async def disconnect(self) -> None:
        await self._pubsub.close()
        await self._conn.close()
        del self._conn
        del self._pubsub

    @connected
    async def subscribe(self, channel: str) -> None:
        await self._pubsub.subscribe(channel)
        self._subscribed_event.set()

    @connected
    async def unsubscribe(self, channel: str) -> None:
        await self._pubsub.unsubscribe(channel)

    @connected
    async def publish(self, channel: str, event: Event) -> None:
        await self._conn.publish(channel, str(event))

    @connected
    async def next_published(self) -> tuple[str, Event]:
        async def _next_published() -> tuple[str, Event] | None:
            # Wait until there are no subscribers
            while not self._pubsub.subscribed or self._pubsub.connection is None:
                await self._subscribed_event.wait()
            self._subscribed_event.clear()

            # Get and process the message if its an Event or return None
            message = await self._pubsub.get_message(ignore_subscribe_messages=True, timeout=0.01)

            if message is not None:
                channel = message["channel"].decode()
                raw_event = message["data"].decode()

                try:
                    event = Event.parse_raw(raw_event)
                except ValidationError as e:
                    logger.warning(
                        f"error parsing a raw event '{raw_event}' from the channel '{channel}'.\n{e}",
                        extra={"action": "pubsub.listen", "channel": channel, "raw_event": raw_event, "error": e},
                    )
                else:
                    return channel, event

            return None

        # Run _next_published() until we have an Event
        published: tuple[str, Event] | None = None
        while published is None:
            published = await _next_published()
        return published
