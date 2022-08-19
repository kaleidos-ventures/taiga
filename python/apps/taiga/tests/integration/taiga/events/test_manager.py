# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
from unittest.mock import Mock

import pytest
from fastapi.websockets import WebSocket
from taiga.events import channels
from taiga.events.events import Event
from taiga.events.manager import EventsManager
from taiga.events.pubsub import RedisPubSubBackend
from tests.utils import factories as f


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
    c = {"msg": "msg"}
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
    sender = f.build_user()
    user = f.build_user()
    channel = channels.user_channel(user)
    t = "event"
    c = {"msg": "msg"}
    event = Event(type=t, sender=sender.username, content=c)

    websocket = Mock(spec=WebSocket, scope={})
    async with EventsManager(backend=pubsub) as manager:
        async with manager.register(websocket) as subscriber:
            await manager.subscribe(subscriber, channel)

            await manager.publish_on_user_channel(user=user, type=t, sender=sender, content=c)
            res = await subscriber.get()
            assert res.type == "event"
            assert res.channel == channel
            assert res.event == event


async def test_pubsub_manager_publish_on_project_channel(pubsub):
    sender = f.build_user()
    project = f.build_project()
    channel = channels.project_channel(project)
    t = "event"
    c = {"msg": "msg"}
    event = Event(type=t, sender=sender.username, content=c)

    websocket = Mock(spec=WebSocket, scope={})
    async with EventsManager(backend=pubsub) as manager:
        async with manager.register(websocket) as subscriber:
            await manager.subscribe(subscriber, channel)

            await manager.publish_on_project_channel(project=project, type=t, sender=sender, content=c)
            res = await subscriber.get()
            assert res.type == "event"
            assert res.channel == channel
            assert res.event == event


async def test_pubsub_manager_publish_on_workspace_channel(pubsub):
    sender = f.build_user()
    workspace = f.build_workspace()
    channel = channels.workspace_channel(workspace)
    t = "event"
    c = {"msg": "msg"}
    event = Event(type=t, sender=sender.username, content=c)

    websocket = Mock(spec=WebSocket, scope={})
    async with EventsManager(backend=pubsub) as manager:
        async with manager.register(websocket) as subscriber:
            await manager.subscribe(subscriber, channel)

            await manager.publish_on_workspace_channel(workspace=workspace, type=t, sender=sender, content=c)
            res = await subscriber.get()
            assert res.type == "event"
            assert res.channel == channel
            assert res.event == event


async def test_pubsub_manager_prevent_send_events_to_the_sender(pubsub):
    user1 = f.build_user(username="us1")
    user2 = f.build_user(username="us2")
    user3 = f.build_user(username="us3")
    project = f.build_project()
    channel = channels.project_channel(project)
    t = "event"
    c = {"msg": "msg"}
    event1 = Event(type=t, sender=user1.username, content=c)
    event2 = Event(type=t, sender=user2.username, content=c)
    event3 = Event(type=t, sender=user3.username, content=c)

    websocket1 = Mock(spec=WebSocket, scope={}, user=user1)
    websocket2 = Mock(spec=WebSocket, scope={}, user=user2)
    async with EventsManager(backend=pubsub) as manager:
        async with (manager.register(websocket1) as subscriber1, manager.register(websocket2) as subscriber2):
            await manager.subscribe(subscriber1, channel)
            await manager.subscribe(subscriber2, channel)

            await manager.publish_on_project_channel(project=project, type=t, sender=user1, content=c)
            await manager.publish_on_project_channel(project=project, type=t, sender=user2, content=c)
            await manager.publish_on_project_channel(project=project, type=t, sender=user3, content=c)

            # subscriber1 received ev2 and ev3
            res = await subscriber1.get()
            assert res.type == "event"
            assert res.channel == channel
            assert res.event == event2
            res = await subscriber1.get()
            assert res.type == "event"
            assert res.channel == channel
            assert res.event == event3

            # subscriber2 received ev1 and ev3
            res = await subscriber2.get()
            assert res.type == "event"
            assert res.channel == channel
            assert res.event == event1
            res = await subscriber2.get()
            assert res.type == "event"
            assert res.channel == channel
            assert res.event == event3
