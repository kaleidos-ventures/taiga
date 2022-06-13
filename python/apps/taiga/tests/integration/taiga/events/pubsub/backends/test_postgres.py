# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import logging

import pytest
from taiga.base.db import db_connection_params
from taiga.events.events import Event
from taiga.events.pubsub.backends.exceptions import PubSubBackendIsNotConnected
from taiga.events.pubsub.backends.postgres import PostgresPubSubBackend


@pytest.fixture
def pubsub() -> PostgresPubSubBackend:
    return PostgresPubSubBackend(**db_connection_params())


async def test_connect(pubsub):
    assert not pubsub.is_connected
    await pubsub.connect()
    assert pubsub.is_connected


async def test_disconnect(pubsub):
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
    assert "test_ch_1" not in pubsub._conn._listeners
    await pubsub.subscribe("test_ch_1")
    assert "test_ch_1" in pubsub._conn._listeners


async def test_unsubscribe(pubsub):
    await pubsub.connect()
    await pubsub.subscribe("test_ch_1")
    assert "test_ch_1" in pubsub._conn._listeners
    await pubsub.unsubscribe("test_ch_1")
    assert "test_ch_1" not in pubsub._conn._listeners


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
    # publish invalid event
    await pubsub.publish(channel1, "INVALID EVENT")
    await pubsub.publish(channel1, "INVALID EVENT")


async def test_publish_invalid_events_and_listen(pubsub, caplog):
    with caplog.at_level(logging.NOTSET, logger="taiga.events.pubsub.backends.postgres"):
        channel = "test_ch"
        event1 = Event(type="test", content={"msg": "msg1"})
        event2 = Event(type="test", content={"msg": "msg2"})

        await pubsub.connect()
        await pubsub.subscribe(channel)
        # publish
        await pubsub.publish(channel, event1)
        await pubsub.publish(channel, "INVALID EVENT")
        await pubsub.publish(channel, event2)
        # listen
        assert (channel, event1) == await pubsub.next_published()
        assert (channel, event2) == await pubsub.next_published()
