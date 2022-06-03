# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import FastAPI, WebSocket
from starlette.concurrency import run_until_first_complete
from taiga.base.db import db_connection_params
from taiga.events.manager import EventsManager, Subscriber

manager = EventsManager(**db_connection_params())


async def connect_events_manager() -> None:
    await manager.connect()


async def disconnect_events_manager() -> None:
    await manager.disconnect()


app = FastAPI()


@app.websocket("/")
async def events(websocket: WebSocket) -> None:
    await websocket.accept()

    async with manager.register(websocket=websocket) as subscriber:
        await run_until_first_complete(
            (_ws_receptions_handler, {"websocket": websocket}),
            (_ws_sendings_handler, {"websocket": websocket, "subscriber": subscriber}),
        )


async def _ws_receptions_handler(websocket: WebSocket) -> None:
    async for data in websocket.iter_json():
        # Note: You can use here `match/case` but mypy does not support it yet (2022-Jun-07).
        #         match data["cmd"]:
        #            case "subscribe": ...
        #            case "unsubscribe": ...
        #            case "ping": ...
        if data["cmd"] == "subscribe":
            await manager.subscribe(websocket=websocket, channel=data["attrs"]["channel"])
        elif data["cmd"] == "unsubscribe":
            await manager.unsubscribe(websocket=websocket, channel=data["attrs"]["channel"])
        elif data["cmd"] == "ping":
            await websocket.send_text("pong")


async def _ws_sendings_handler(websocket: WebSocket, subscriber: Subscriber) -> None:
    async for event in subscriber:
        await websocket.send_text(event.message)
