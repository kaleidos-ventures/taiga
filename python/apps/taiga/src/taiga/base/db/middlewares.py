# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Awaitable, Callable

from asgiref.sync import sync_to_async
from django.db import close_old_connections, reset_queries
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class DBConnectionMiddleware(BaseHTTPMiddleware):
    """
    This middleware reset and clean db connections with the database for the ORM if it is necesary.

    (Based on the code at https://github.com/django/django/blob/main/django/db/__init__.py)
    """

    @sync_to_async
    def _reset_queries(self) -> None:
        reset_queries()

    @sync_to_async
    def _close_old_connections(self) -> None:
        close_old_connections()

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        try:
            await self._reset_queries()
            await self._close_old_connections()
            return await call_next(request)
        finally:
            await self._close_old_connections()
