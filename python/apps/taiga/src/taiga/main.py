# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException
from taiga import __description__, __title__, __version__
from taiga.base.db.middlewares import DBConnectionMiddleware
from taiga.base.logging.middlewares import CorrelationIdMiddleware
from taiga.base.services.exceptions import TaigaServiceException
from taiga.conf import settings
from taiga.exceptions.api import handlers
from taiga.exceptions.api.middlewares import UnexpectedExceptionMiddleware
from taiga.routers.loader import load_routes
from taiga.tasksqueue.middlewares import TaskQueueMiddleware

api = FastAPI(
    title=__title__,
    description=__description__,
    version=__version__,
    debug=settings.DEBUG,
)


##############################################
# MIDDLEWARES
##############################################

# DB connections middleware
api.add_middleware(DBConnectionMiddleware)

# TaskQueue middleware
api.add_middleware(TaskQueueMiddleware)

# Catch unexpected exceptions middleware
api.add_middleware(UnexpectedExceptionMiddleware)

# Setup CORS middleware
api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=[
        "accept-encoding",
        "authorization",
        "content-type",
        CorrelationIdMiddleware.CORRELATION_ID_HEADER_NAME,
    ],
    expose_headers=[
        "pagination-offset",
        "pagination-limit",
        "pagination-total",
        CorrelationIdMiddleware.CORRELATION_ID_HEADER_NAME,
    ],
    max_age=1800,
)

# Logging Correlation ID middleware
api.add_middleware(CorrelationIdMiddleware)


##############################################
# EXCEPTIONS
##############################################

# Override exception handlers
api.exception_handler(HTTPException)(handlers.http_exception_handler)
api.exception_handler(RequestValidationError)(handlers.request_validation_exception_handler)
api.exception_handler(TaigaServiceException)(handlers.taiga_service_exception_handler)


##############################################
# ROUTERS
##############################################

# Add routers
load_routes(api)
