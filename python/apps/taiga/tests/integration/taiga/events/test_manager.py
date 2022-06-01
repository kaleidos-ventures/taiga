# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi.websockets import WebSocket
from taiga.base.db import db_connection_params
from taiga.events.manager import EventsManager
from taiga.events.pubsub import Event


async def test_pubsub_manager_publish_and_listen():
    channel1 = "channel-1"
    channel2 = "channel-2"
    event11 = Event(channel1, "msg-11")
    event12 = Event(channel1, "msg-12")
    event21 = Event(channel2, "msg-21")
    event22 = Event(channel2, "msg-22")
    websocket = WebSocket(scope={"type": "websocket"}, receive=None, send=None)
    async with EventsManager(**db_connection_params()) as manager:
        async with manager.register(websocket) as subscriber:
            await manager.subscribe(websocket, channel1)

            await manager.publish(event11.channel, event11.message)  # ok
            await manager.publish(event21.channel, event21.message)
            await manager.publish(event12.channel, event12.message)  # ok
            await manager.publish(event22.channel, event22.message)
            assert await subscriber.get() == event11
            assert await subscriber.get() == event12

            await manager.subscribe(websocket, channel2)

            await manager.publish(event11.channel, event11.message)  # ok
            await manager.publish(event21.channel, event21.message)  # ok
            await manager.publish(event12.channel, event12.message)  # ok
            await manager.publish(event22.channel, event22.message)  # ok
            assert await subscriber.get() == event11
            assert await subscriber.get() == event21
            assert await subscriber.get() == event12
            assert await subscriber.get() == event22

            await manager.unsubscribe(websocket, channel1)

            await manager.publish(event11.channel, event11.message)
            await manager.publish(event21.channel, event21.message)  # ok
            await manager.publish(event12.channel, event12.message)
            await manager.publish(event22.channel, event22.message)  # ok
            assert await subscriber.get() == event21
            assert await subscriber.get() == event22
