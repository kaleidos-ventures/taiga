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

import logging
from asyncio import Queue
from typing import Any

import asyncpg
from pydantic import ValidationError
from taiga.events.events import Event

from .base import PubSubBackend, connected

logger = logging.getLogger(__name__)


class PostgresPubSubBackend(PubSubBackend):
    def __init__(self, **conn_kwargs: Any) -> None:
        self._conn_args = conn_kwargs.copy()

    @property
    def is_connected(self) -> bool:
        conn = getattr(self, "_conn", None)
        return conn is not None and not conn.is_closed()

    async def connect(self) -> None:
        self._conn = await asyncpg.connect(**self._conn_args)
        self._listen_queue: Queue[tuple[str, Event]] = Queue()

    @connected
    async def disconnect(self) -> None:
        await self._conn.close()

    def _listener(self, *args: Any) -> None:
        connection, pid, channel, raw_event = args
        try:
            event = Event.parse_raw(raw_event)
        except ValidationError as e:
            logger.warning(
                f"Error parsing a raw event '{raw_event}' from the channel '{channel}'.\n{e}",
                extra={"action": "pubsub.listen", "channel": channel, "raw_event": raw_event, "error": e},
            )
        else:
            self._listen_queue.put_nowait((channel, event))

    @connected
    async def subscribe(self, channel: str) -> None:
        await self._conn.add_listener(channel, self._listener)

    @connected
    async def unsubscribe(self, channel: str) -> None:
        await self._conn.remove_listener(channel, self._listener)

    @connected
    async def publish(self, channel: str, event: Event) -> None:
        await self._conn.execute("SELECT pg_notify($1, $2);", channel, str(event))

    @connected
    async def next_published(self) -> tuple[str, Event]:
        return await self._listen_queue.get()
