# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC
from unittest.mock import Mock

import pytest
from fastapi.websockets import WebSocket
from taiga.base.serializers import BaseModel
from taiga.events import channels
from taiga.events.events import Event
from taiga.events.manager import EventsManager
from taiga.events.pubsub import RedisPubSubBackend
from tests.utils import factories as f


class MsgEventContent(BaseModel):
    msg: str


@pytest.fixture
async def pubsub() -> RedisPubSubBackend:
    pubsub = RedisPubSubBackend(host="localhost", port=6379, db=0)
    # pubsub = MemoryPubSubBackend()
    yield pubsub

    if pubsub.is_connected:
        await pubsub.disconnect()


async def test_pubsub_manager_publish_and_listen(pubsub):
    channel1 = "channel-1"
    channel2 = "channel-2"
    event11 = Event(type="ev-11")
    event12 = Event(type="ev-12")
    event21 = Event(type="ev-21")
    event22 = Event(type="ev-22")

    websocket = Mock(spec=WebSocket, scope={})
    async with EventsManager(backend=pubsub) as manager:
        async with manager.register(websocket) as subscriber:
            await manager.subscribe(subscriber, channel1)

            await manager.publish(channel1, event11)  # ok
            await manager.publish(channel2, event21)
            await manager.publish(channel1, event12)  # ok
            await manager.publish(channel2, event22)
            res = await subscriber.get()
            assert res.type == "event"
            assert res.channel == channel1
            assert res.event == event11
            res = await subscriber.get()
            assert res.type == "event"
            assert res.channel == channel1
            assert res.event == event12

            await manager.subscribe(subscriber, channel2)

            await manager.publish(channel1, event11)  # ok
            await manager.publish(channel2, event21)  # ok
            await manager.publish(channel1, event12)  # ok
            await manager.publish(channel2, event22)  # ok
            res = await subscriber.get()
            assert res.type == "event"
            assert res.channel == channel1
            assert res.event == event11
            res = await subscriber.get()
            assert res.type == "event"
            assert res.channel == channel2
            assert res.event == event21
            res = await subscriber.get()
            assert res.type == "event"
            assert res.channel == channel1
            assert res.event == event12
            res = await subscriber.get()
            assert res.type == "event"
            assert res.channel == channel2
            assert res.event == event22

            await manager.unsubscribe(subscriber, channel1)

            await manager.publish(channel1, event11)
            await manager.publish(channel2, event21)  # ok
            await manager.publish(channel1, event12)
            await manager.publish(channel2, event22)  # ok
            res = await subscriber.get()
            assert res.type == "event"
            assert res.channel == channel2
            assert res.event == event21
            res = await subscriber.get()
            assert res.type == "event"
            assert res.channel == channel2
            assert res.event == event22


async def test_pubsub_manager_publish_on_system_channel(pubsub):
    channel = channels.system_channel()
    t = "event"
    c = MsgEventContent(msg="msg")
    event = Event(type=t, content=c)

    websocket = Mock(spec=WebSocket, scope={})
    async with EventsManager(backend=pubsub) as manager:
        async with manager.register(websocket) as subscriber:
            await manager.subscribe(subscriber, channel)

            await manager.publish_on_system_channel(type=t, content=c)
            res = await subscriber.get()
            assert res.type == t
            assert res.channel == channel
            assert res.event == event


async def test_pubsub_manager_publish_on_user_channel(pubsub):
    user = f.build_user()
    channel = channels.user_channel(user)
    t = "event"
    c = MsgEventContent(msg="msg")
    event = Event(type=t, content=c)

    websocket = Mock(spec=WebSocket, scope={})
    async with EventsManager(backend=pubsub) as manager:
        async with manager.register(websocket) as subscriber:
            await manager.subscribe(subscriber, channel)

            await manager.publish_on_user_channel(user=user, type=t, content=c)
            res = await subscriber.get()
            assert res.type == "event"
            assert res.channel == channel
            assert res.event == event


async def test_pubsub_manager_publish_on_project_channel(pubsub):
    project = f.build_project()
    channel = channels.project_channel(project)
    t = "event"
    c = MsgEventContent(msg="msg")
    event = Event(type=t, content=c)

    websocket = Mock(spec=WebSocket, scope={})
    async with EventsManager(backend=pubsub) as manager:
        async with manager.register(websocket) as subscriber:
            await manager.subscribe(subscriber, channel)

            await manager.publish_on_project_channel(project=project, type=t, content=c)
            res = await subscriber.get()
            assert res.type == "event"
            assert res.channel == channel
            assert res.event == event


async def test_pubsub_manager_publish_on_workspace_channel(pubsub):
    workspace = f.build_workspace()
    channel = channels.workspace_channel(workspace)
    t = "event"
    c = MsgEventContent(msg="msg")
    event = Event(type=t, content=c)

    websocket = Mock(spec=WebSocket, scope={})
    async with EventsManager(backend=pubsub) as manager:
        async with manager.register(websocket) as subscriber:
            await manager.subscribe(subscriber, channel)

            await manager.publish_on_workspace_channel(workspace=workspace, type=t, content=c)
            res = await subscriber.get()
            assert res.type == "event"
            assert res.channel == channel
            assert res.event == event
