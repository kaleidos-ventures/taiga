# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from asyncio import Task
from typing import AsyncGenerator
from unittest.mock import Mock, patch

import pytest
from fastapi.websockets import WebSocket
from taiga.events.manager import EventsManager
from taiga.events.pubsub import MemoryPubSubBackend


@pytest.fixture
async def manager() -> AsyncGenerator[EventsManager, None]:
    manager = EventsManager(backend=MemoryPubSubBackend())
    await manager.connect()

    yield manager

    if manager.is_connected:
        await manager.disconnect()


async def test_connection():
    manager = EventsManager(backend=MemoryPubSubBackend())
    assert not manager.is_connected
    assert getattr(manager, "_listener_task", None) is None
    await manager.connect()
    assert manager.is_connected
    assert getattr(manager, "_listener_task", None) is not None
    await manager.disconnect()


async def test_disconnection_with_no_pending_task():
    manager = EventsManager(backend=MemoryPubSubBackend())
    mock_task = Mock(spec=Task)

    # To prevent error with `create_task(self._listener())`
    # (coroutine 'EventsManager._listener' was never awaited)
    manager._listener = lambda: ...

    with patch("taiga.events.manager.create_task", return_value=mock_task):
        mock_task.done.return_value = True
        await manager.connect()
        assert manager.is_connected
        assert getattr(manager, "_listener_task", None) is not None
        await manager.disconnect()
        assert not manager.is_connected
        mock_task.result.assert_called_once()
        mock_task.cancel.assert_not_called()


async def test_disconnection_with_pending_task():
    manager = EventsManager(backend=MemoryPubSubBackend())
    mock_task = Mock(spec=Task)

    # To prevent error with `create_task(self._listener())`
    # (coroutine 'EventsManager._listener' was never awaited)
    manager._listener = lambda: ...

    with patch("taiga.events.manager.create_task", return_value=mock_task):
        mock_task.done.return_value = False
        await manager.connect()
        assert manager.is_connected
        assert getattr(manager, "_listener_task", None) is not None
        await manager.disconnect()
        assert not manager.is_connected
        mock_task.result.assert_not_called()
        mock_task.cancel.assert_called_once()


async def test_register_and_unregister_a_websocket(manager):
    websocket = Mock(spec=WebSocket, scope={})

    # register
    assert manager._subscribers == {}
    async with manager.register(websocket) as subscriber:
        assert manager._subscribers[subscriber.id] == subscriber

    # unregister
    assert manager._subscribers == {}


async def test_subscribe(manager):
    websocket1 = Mock(spec=WebSocket, scope={})
    websocket2 = Mock(spec=WebSocket, scope={})
    channel = "channel1"

    async with (
        manager.register(websocket1) as subscriber1,
        manager.register(websocket2) as subscriber2,
    ):
        assert channel not in manager._channels

        await manager.subscribe(subscriber1, channel)

        assert channel in manager._channels
        assert len(manager._channels[channel]) == 1

        await manager.subscribe(subscriber2, channel)

        assert channel in manager._channels
        assert len(manager._channels[channel]) == 2


async def test_unsubscribe(manager):
    websocket1 = Mock(spec=WebSocket, scope={})
    websocket2 = Mock(spec=WebSocket, scope={})
    channel = "channel1"

    async with (
        manager.register(websocket1) as subscriber1,
        manager.register(websocket2) as subscriber2,
    ):
        await manager.subscribe(subscriber1, channel)
        await manager.subscribe(subscriber2, channel)

        assert channel in manager._channels
        assert len(manager._channels[channel]) == 2

        assert await manager.unsubscribe(subscriber1, channel)

        assert channel in manager._channels
        assert len(manager._channels[channel]) == 1

        assert await manager.unsubscribe(subscriber2, channel)

        assert channel not in manager._channels


async def test_unsubscribe_from_a_non_subscribed_channel(manager):
    websocket = Mock(spec=WebSocket, scope={})
    channel = "channel1"

    async with (manager.register(websocket) as subscriber,):

        assert channel not in manager._channels

        assert not await manager.unsubscribe(subscriber, channel)

        assert channel not in manager._channels


async def test_unsubscribe_a_non_subscribed_subscriber(manager):
    websocket1 = Mock(spec=WebSocket, scope={})
    websocket2 = Mock(spec=WebSocket, scope={})
    channel = "channel1"

    async with (
        manager.register(websocket1) as subscriber1,
        manager.register(websocket2) as subscriber2,
    ):
        await manager.subscribe(subscriber1, channel)

        assert channel in manager._channels
        assert len(manager._channels[channel]) == 1

        assert not await manager.unsubscribe(subscriber2, channel)

        assert channel in manager._channels
        assert len(manager._channels[channel]) == 1
