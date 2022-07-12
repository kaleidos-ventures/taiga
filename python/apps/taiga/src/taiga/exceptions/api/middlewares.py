# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import logging
import traceback
from typing import Awaitable, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR
from starlette.types import ASGIApp
from taiga.exceptions.api import codes

logger = logging.getLogger(__name__)


class UnexpectedExceptionMiddleware(BaseHTTPMiddleware):
    """
    This middleware is just for unexpected server errors can be returned with CORS credentials.
    To do this, it captures unexpected errors and returns an HTTP 500 response. If it didn't exist,
    the error would be sent to the ASGI server, which would not add these headers.

    Based on https://github.com/tiangolo/fastapi/issues/775#issuecomment-592946834
    """

    def __init__(self, app: ASGIApp, debug: bool | None = None) -> None:
        super().__init__(app)

        if debug is None:
            self.debug = getattr(app, "debug", False)
        else:
            self.debug = debug

    def _generate_error_detail(self, exc: Exception) -> str | dict[str, str]:
        if self.debug:
            return {
                "exception": repr(exc),
                "traceback": "".join(traceback.format_exception(type(exc), exc, exc.__traceback__)),
            }
        return "internal-server-error"

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        try:
            return await call_next(request)
        except Exception as exc:
            logger.exception(exc)

            return JSONResponse(
                status_code=HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "error": {
                        "code": codes.EX_INTERNAL_SERVER_ERROR.code,
                        "detail": self._generate_error_detail(exc),
                        "msg": codes.EX_INTERNAL_SERVER_ERROR.msg,
                    }
                },
            )
