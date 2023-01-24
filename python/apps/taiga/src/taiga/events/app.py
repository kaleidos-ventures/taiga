# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import logging

from fastapi import FastAPI, WebSocket
from taiga.base.utils.concurrency import run_until_first_complete
from taiga.base.utils.tests import is_test_running
from taiga.events.logging import setup_logging
from taiga.events.manager import manager


async def connect_events_manager() -> None:
    if is_test_running():
        setup_logging(logging.ERROR)
    else:
        setup_logging()
    await manager.connect()


async def disconnect_events_manager() -> None:
    await manager.disconnect()


app = FastAPI()


@app.websocket("/")
async def events(websocket: WebSocket) -> None:
    async with manager.register(websocket=websocket) as subscriber:
        await run_until_first_complete(
            (subscriber.receptions_handler, {}),
            (subscriber.sending_handler, {}),
        )
