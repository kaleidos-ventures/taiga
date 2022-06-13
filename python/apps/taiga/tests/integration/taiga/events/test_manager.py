# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
from unittest.mock import Mock

from fastapi.websockets import WebSocket
from taiga.base.db import db_connection_params
from taiga.events import channels
from taiga.events.events import Event
from taiga.events.manager import EventsManager
from tests.utils import factories as f


async def test_pubsub_manager_publish_and_listen():
    channel1 = "channel-1"
    channel2 = "channel-2"
    event11 = Event(type="ev-11")
    event12 = Event(type="ev-12")
    event21 = Event(type="ev-21")
    event22 = Event(type="ev-22")

    websocket = Mock(spec=WebSocket)
    async with EventsManager(**db_connection_params()) as manager:
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


async def test_pubsub_manager_publish_on_system_channel():
    channel = channels.system_channel()
    t = "event"
    c = {"msg": "msg"}
    event = Event(type=t, content=c)

    websocket = Mock(spec=WebSocket)
    async with EventsManager(**db_connection_params()) as manager:
        async with manager.register(websocket) as subscriber:
            await manager.subscribe(subscriber, channel)

            await manager.publish_on_system_channel(type=t, content=c)
            res = await subscriber.get()
            assert res.type == t
            assert res.channel == channel
            assert res.event == event


async def test_pubsub_manager_publish_on_user_channel():
    user = f.build_user()
    channel = channels.user_channel(user)
    t = "event"
    c = {"msg": "msg"}
    event = Event(type=t, content=c)

    websocket = Mock(spec=WebSocket)
    async with EventsManager(**db_connection_params()) as manager:
        async with manager.register(websocket) as subscriber:
            await manager.subscribe(subscriber, channel)

            await manager.publish_on_user_channel(user=user, type=t, content=c)
            res = await subscriber.get()
            assert res.type == "event"
            assert res.channel == channel
            assert res.event == event


async def test_pubsub_manager_publish_on_project_channel():
    project = f.build_project()
    channel = channels.project_channel(project)
    t = "event"
    c = {"msg": "msg"}
    event = Event(type=t, content=c)

    websocket = Mock(spec=WebSocket)
    async with EventsManager(**db_connection_params()) as manager:
        async with manager.register(websocket) as subscriber:
            await manager.subscribe(subscriber, channel)

            await manager.publish_on_project_channel(project=project, type=t, content=c)
            res = await subscriber.get()
            assert res.type == "event"
            assert res.channel == channel
            assert res.event == event


async def test_pubsub_manager_publish_on_workspace_channel():
    workspace = f.build_workspace()
    channel = channels.workspace_channel(workspace)
    t = "event"
    c = {"msg": "msg"}
    event = Event(type=t, content=c)

    websocket = Mock(spec=WebSocket)
    async with EventsManager(**db_connection_params()) as manager:
        async with manager.register(websocket) as subscriber:
            await manager.subscribe(subscriber, channel)

            await manager.publish_on_workspace_channel(workspace=workspace, type=t, content=c)
            res = await subscriber.get()
            assert res.type == "event"
            assert res.channel == channel
            assert res.event == event
