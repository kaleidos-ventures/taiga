# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import logging
from unittest.mock import Mock, patch

import pytest
from fastapi.websockets import WebSocket
from taiga.auth.services.exceptions import BadAuthTokenError, UnauthorizedUserError
from taiga.events.actions import PingAction
from taiga.events.events import Event
from taiga.events.manager import EventsManager
from taiga.events.responses import EventResponse, SystemResponse
from taiga.events.subscriber import Subscriber
from tests.utils import factories as f


@pytest.fixture
def subscriber(client):
    with client.websocket_connect("/events/") as websocket:
        yield Subscriber(
            manager=Mock(spec=EventsManager),
            websocket=websocket,
        )


def test_subscriber_id_sequence(client):
    with (
        client.websocket_connect("/events/") as websocket1,
        client.websocket_connect("/events/") as websocket2,
        client.websocket_connect("/events/") as websocket3,
    ):
        manager = Mock(spec=EventsManager)

        sub1 = Subscriber(manager=manager, websocket=websocket1)
        sub2 = Subscriber(manager=manager, websocket=websocket2)
        sub3 = Subscriber(manager=manager, websocket=websocket3)

        assert sub1.id == sub2.id - 1 == sub3.id - 2


def test_subscriber_init(client):
    with client.websocket_connect("/events/") as websocket:
        sub = Subscriber(manager=Mock(spec=EventsManager), websocket=websocket)

        assert sub.id
        assert "auth" in sub._websocket.scope
        assert sub._websocket.scope["auth"].scopes == []
        assert "user" in sub._websocket.scope
        assert sub._websocket.scope["user"].is_anonymous


async def test_subscriber_as_iterator(subscriber):
    res1 = SystemResponse()
    res2 = SystemResponse()

    await subscriber.put(res1)
    await subscriber.put(res2)
    await subscriber.close()

    iter = aiter(subscriber)

    data = await anext(iter)
    assert res1 == data

    data = await anext(iter)
    assert res2 == data

    with pytest.raises(StopAsyncIteration):
        data = await anext(iter)


async def test_subscriber_signup_success(subscriber):
    user = f.build_user
    token = "some-token"
    scopes = ["auth"]

    with patch("taiga.events.subscriber.authenticate", autospec=True) as fake_authenticate:
        fake_authenticate.return_value = (scopes, user)

        await subscriber.signin(token=token)

        assert "auth" in subscriber._websocket.scope
        assert subscriber._websocket.scope["auth"].scopes == scopes
        assert "user" in subscriber._websocket.scope
        assert subscriber._websocket.scope["user"] == user


async def test_subscriber_signup_error_bad_token(subscriber):
    with patch("taiga.events.subscriber.authenticate", autospec=True) as fake_authenticate:
        fake_authenticate.side_effect = BadAuthTokenError

        await subscriber.signin(token="bad-token")

        assert "auth" in subscriber._websocket.scope
        assert subscriber._websocket.scope["auth"].scopes == []
        assert "user" in subscriber._websocket.scope
        assert subscriber._websocket.scope["user"].is_anonymous


async def test_subscriber_signup_error_unauthorízed_user(subscriber):
    with patch("taiga.events.subscriber.authenticate", autospec=True) as fake_authenticate:
        fake_authenticate.side_effect = UnauthorizedUserError

        await subscriber.signin(token="token")

        assert "auth" in subscriber._websocket.scope
        assert subscriber._websocket.scope["auth"].scopes == []
        assert "user" in subscriber._websocket.scope
        assert subscriber._websocket.scope["user"].is_anonymous


async def test_subscriber_signout(subscriber):
    user = f.build_user
    scopes = ["auth"]
    subscriber._websocket.scope["auth"].scopes = scopes
    subscriber._websocket.scope["user"] = user

    await subscriber.signout()

    assert "auth" in subscriber._websocket.scope
    assert subscriber._websocket.scope["auth"].scopes == []
    assert "user" in subscriber._websocket.scope
    assert subscriber._websocket.scope["user"] != user
    assert subscriber._websocket.scope["user"].is_anonymous


def test_subscriber_receptions_handler_with_valid_action(subscriber):
    ws = subscriber._websocket
    action = {"command": "ping"}

    ws.send_json(action)
    res = ws.receive_json()

    assert res["status"] == "ok"
    assert res["content"]["message"] == "pong"


def test_subscriber_receptions_handler_with_invalid_action(subscriber):
    ws = subscriber._websocket
    action = {"command": "invalid-command"}

    ws.send_json(action)
    res = ws.receive_json()

    assert res["status"] == "error"
    assert res["content"]["detail"] == "invalid-action"


async def test_subscriber_receptions_handler_with_some_response(subscriber):
    fake_ws = Mock(spec=WebSocket)
    subscriber._websocket = fake_ws
    res = SystemResponse(status="ok", content={"detail": "test-event"})

    await subscriber.put(res)
    await subscriber.close()
    await subscriber.sending_handler()

    fake_ws.send_text.assert_awaited_once_with(res.json(by_alias=True))


async def test_subscriber_receptions_handler_with_event_response_with_action(subscriber, caplog):
    fake_ws = Mock(spec=WebSocket)
    subscriber._websocket = fake_ws
    res = EventResponse(channel="test", event=Event(type="action"))

    await subscriber.put(res)
    await subscriber.close()
    with caplog.at_level(logging.CRITICAL, logger="taiga.events.subscriber"):
        await subscriber.sending_handler()

    fake_ws.send_text.assert_not_awaited()


async def test_subscriber_receptions_handler_with_event_response_with_invalid_action(subscriber):
    fake_ws = Mock(spec=WebSocket)
    fake_put = Mock()
    subscriber._websocket = fake_ws
    res = EventResponse(channel="test", event=Event(type="action", content=PingAction()))

    await subscriber.put(res)
    await subscriber.close()
    subscriber.put = fake_put
    await subscriber.sending_handler()

    fake_ws.send_text.assert_not_awaited()
    fake_put.assert_called_once()
