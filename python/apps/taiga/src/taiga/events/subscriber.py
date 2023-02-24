# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import itertools
import logging
from asyncio import Queue
from typing import TYPE_CHECKING, AsyncGenerator, ClassVar, Final, Iterator, cast

from fastapi import WebSocket
from pydantic import ValidationError
from starlette.authentication import AuthCredentials
from taiga.auth.services import authenticate
from taiga.auth.services.exceptions import BadAuthTokenError, UnauthorizedUserError
from taiga.events.actions import parse_action_from_obj, parse_action_from_text
from taiga.events.responses import EventResponse, Response, SystemResponse
from taiga.users.models import AnonymousUser, AnyUser

if TYPE_CHECKING:
    from taiga.events.manager import EventsManager


logger = logging.getLogger(__name__)


class Unsubscribed(Exception):
    pass


class Subscriber:
    _id_seq: ClassVar[Iterator[int]] = itertools.count(start=1)

    def __init__(self, manager: "EventsManager", websocket: WebSocket) -> None:
        self._manager = manager
        self._websocket = websocket
        self._queue: Queue[Response | None] = Queue()
        self.id: Final = next(Subscriber._id_seq)
        self._set_anonymous_user()

    async def __aiter__(self) -> AsyncGenerator[Response, None]:
        try:
            while True:
                yield await self.get()
        except Unsubscribed:
            pass

    def __repr__(self) -> str:
        return f"Subscriber(id={self.id!r})"

    @property
    def user(self) -> AnyUser:
        return self._websocket.user

    async def get(self) -> Response:
        response = await self._queue.get()
        if response is None:
            # The connection has finished
            raise Unsubscribed()
        return response

    async def put(self, response: Response | None) -> None:
        await self._queue.put(response)

    async def close(self) -> None:
        await self.put(None)

    def _set_anonymous_user(self) -> None:
        self._websocket.scope["auth"] = AuthCredentials([])
        self._websocket.scope["user"] = AnonymousUser()

    async def signin(self, token: str) -> bool:
        try:
            scope, user = await authenticate(token=token)
            self._websocket.scope["auth"] = AuthCredentials(scope)
            self._websocket.scope["user"] = user
            return True
        except (BadAuthTokenError, UnauthorizedUserError):
            self._set_anonymous_user()
            return False

    async def signout(self) -> None:
        self._set_anonymous_user()

    async def subscribe(self, channel: str) -> None:
        await self._manager.subscribe(subscriber=self, channel=channel)

    async def unsubscribe(self, channel: str) -> bool:
        return await self._manager.unsubscribe(subscriber=self, channel=channel)

    async def receptions_handler(self) -> None:
        async for text in self._websocket.iter_text():
            try:
                action = parse_action_from_text(text)
            except ValidationError as e:
                await self.put(
                    SystemResponse(status="error", content={"detail": "invalid-action", "error": e.errors()})
                )
            else:
                await action.run(subscriber=self)

    async def sending_handler(self) -> None:
        async for response in self:
            if response.type == "event":
                event = cast(EventResponse, response).event
                if event.type == "action":
                    try:
                        action = parse_action_from_obj(event.content)
                    except ValidationError as e:
                        logger.error(
                            f"Recived invalid action: '{event}'.",
                            extra={"action": "subscriver.sending_handler", "event": event, "error": e.errors()},
                        )
                    else:
                        await action.run(subscriber=self)
                    finally:
                        continue
            await self._websocket.send_text(response.json(by_alias=True))
