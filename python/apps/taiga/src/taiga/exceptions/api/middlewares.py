# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import http
import logging
import traceback
from typing import Awaitable, Callable, Final

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)

HTTP_500_STATUS_CODE: Final = 500
HTTP_500: Final = http.HTTPStatus(HTTP_500_STATUS_CODE)
HTTP_500_CODE: Final = HTTP_500.name.replace("_", "-").lower()
HTTP_500_DETAIL: Final = HTTP_500.description
HTTP_500_MSG: Final = HTTP_500.phrase


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
        return HTTP_500_DETAIL

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        try:
            return await call_next(request)
        except Exception as exc:
            logger.exception(exc)

            return JSONResponse(
                status_code=HTTP_500_STATUS_CODE,
                content={
                    "error": {
                        "code": HTTP_500_CODE,
                        "detail": self._generate_error_detail(exc),
                        "msg": HTTP_500_MSG,
                    }
                },
            )
