# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from taiga.events.events import Event
from taiga.events.pubsub.backends.exceptions import PubSubBackendIsNotConnected
from taiga.events.pubsub.backends.memory import MemoryPubSubBackend


@pytest.fixture
def pubsub() -> MemoryPubSubBackend:
    return MemoryPubSubBackend()


async def test_connect(pubsub):
    assert not pubsub.is_connected
    await pubsub.connect()
    assert pubsub.is_connected


async def test_disconnect(pubsub):
    assert not pubsub.is_connected
    await pubsub.connect()
    assert pubsub.is_connected
    await pubsub.disconnect()
    assert not pubsub.is_connected


async def test_method_who_need_connection(pubsub):
    channel = "test_ch"
    event = Event(type="test", content={"msg": "msg"})

    assert not pubsub.is_connected

    with pytest.raises(PubSubBackendIsNotConnected):
        await pubsub.disconnect()
    with pytest.raises(PubSubBackendIsNotConnected):
        await pubsub.subscribe(channel)
    with pytest.raises(PubSubBackendIsNotConnected):
        await pubsub.unsubscribe(channel)
    with pytest.raises(PubSubBackendIsNotConnected):
        await pubsub.publish(channel, event)
    with pytest.raises(PubSubBackendIsNotConnected):
        await pubsub.next_published()


async def test_subscribe(pubsub):
    await pubsub.connect()
    assert "test_ch_1" not in pubsub._channels
    await pubsub.subscribe("test_ch_1")
    assert "test_ch_1" in pubsub._channels


async def test_unsubscribe(pubsub):
    await pubsub.connect()
    await pubsub.subscribe("test_ch_1")
    assert "test_ch_1" in pubsub._channels
    await pubsub.unsubscribe("test_ch_1")
    assert "test_ch_1" not in pubsub._channels


async def test_publish(pubsub):
    await pubsub.connect()
    await pubsub.subscribe("test_ch_1")
    assert pubsub._published.qsize() == 0
    await pubsub.publish("test_ch_1", "msg1")
    assert pubsub._published.qsize() == 1


async def test_publish_and_listen(pubsub):
    channel1 = "test_ch_1"
    channel2 = "test_ch_2"
    event1 = Event(type="test", content={"msg": "msg1"})
    event2 = Event(type="test", content={"msg": "msg2"})

    await pubsub.connect()
    await pubsub.subscribe(channel1)
    # publish
    await pubsub.publish(channel1, event1)
    await pubsub.publish(channel2, event1)
    await pubsub.publish(channel1, event2)
    # listen
    assert (channel1, event1) == await pubsub.next_published()
    assert (channel1, event2) == await pubsub.next_published()
