# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from taiga.events.pubsub.backends.memory import MemoryPubSubBackend
from taiga.events.pubsub.events import Event


@pytest.fixture
def pubsub() -> MemoryPubSubBackend:
    return MemoryPubSubBackend()


async def test_connect(pubsub):
    assert not pubsub.is_connected
    await pubsub.connect()
    assert pubsub.is_connected


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
    ev1 = Event(channel1, "msg1")
    ev2 = Event(channel1, "msg2")

    await pubsub.connect()
    await pubsub.subscribe(channel1)
    # publish
    await pubsub.publish(ev1.channel, ev1.message)
    await pubsub.publish(channel2, "msg")
    await pubsub.publish(ev2.channel, ev2.message)
    # listen
    assert ev1 == await pubsub.next_published()
    assert ev2 == await pubsub.next_published()
