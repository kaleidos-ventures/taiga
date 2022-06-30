# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import http

from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.status import HTTP_400_BAD_REQUEST, HTTP_422_UNPROCESSABLE_ENTITY
from taiga.base.services.exceptions import TaigaServiceException
from taiga.base.utils.strings import camel_to_kebab
from taiga.exceptions.api import HTTPException as TaigaHTTPException
from taiga.exceptions.api import codes


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    if isinstance(exc, TaigaHTTPException):
        http_exc_code = getattr(exc, "code", codes.EX_UNKNOWN.code)
        http_exc_msg = getattr(exc, "msg", codes.EX_UNKNOWN.msg)
    else:  # Starlette's HTTPException
        http_exc_code = http.HTTPStatus(exc.status_code).phrase.replace(" ", "-").lower()
        http_exc_msg = http.HTTPStatus(exc.status_code).description

    http_exc_detail = exc.detail

    content = {
        "error": {
            "code": http_exc_code,
            "detail": http_exc_detail,
            "msg": http_exc_msg,
        }
    }

    headers = getattr(exc, "headers", None)
    if headers:
        return JSONResponse(status_code=exc.status_code, content=content, headers=headers)
    else:
        return JSONResponse(status_code=exc.status_code, content=content)


async def taiga_service_exception_handler(request: Request, exc: TaigaServiceException) -> JSONResponse:
    return JSONResponse(
        status_code=HTTP_400_BAD_REQUEST,
        content={
            "error": {
                "code": codes.EX_BAD_REQUEST.code,
                "detail": camel_to_kebab(exc.__class__.__name__),
                "msg": str(exc),
            }
        },
    )


async def request_validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": codes.EX_VALIDATION_ERROR.code,
                "detail": jsonable_encoder(exc.errors()),
                "msg": codes.EX_VALIDATION_ERROR.msg,
            }
        },
    )
