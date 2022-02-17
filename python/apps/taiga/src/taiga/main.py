# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Awaitable, Callable

from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException
from taiga import __description__, __title__, __version__
from taiga.conf import settings
from taiga.exceptions.handlers import http_exception_handler, request_validation_exception_handler
from taiga.routers import router, tags_metadata

api = FastAPI(
    title=__title__,
    description=__description__,
    version=__version__,
    openapi_tags=tags_metadata,
    debug=settings.DEBUG,
)


##############################################
# COMMON MIDDLEWARES
##############################################

# HACK: To add CORS headers to %00 Error
async def add_cors_headers_to_500_errors(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    try:
        return await call_next(request)
    except Exception:
        # you probably want some kind of logging here
        return Response("Internal server error", status_code=500)


api.middleware("http")(add_cors_headers_to_500_errors)
# HACK END

# Setup CORS middleware
api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


##############################################
# EXCEPTIONS
##############################################

# Override exception handlers
api.exception_handler(HTTPException)(http_exception_handler)
api.exception_handler(RequestValidationError)(request_validation_exception_handler)


##############################################
# ROUTERS
##############################################

# Add routers
api.include_router(router)
