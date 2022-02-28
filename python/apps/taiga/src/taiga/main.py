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
from taiga.conf import settings
from taiga.exceptions.handlers import http_exception_handler, request_validation_exception_handler
from taiga.exceptions.middlewares import UnexpectedExceptionMiddleware
from taiga.routers import router, tags_metadata
from taiga.tasksqueue.middlewares import TaskQueueMiddleware

api = FastAPI(
    title=__title__,
    description=__description__,
    version=__version__,
    openapi_tags=tags_metadata,
    debug=settings.DEBUG,
)


##############################################
# MIDDLEWARES
##############################################

# TaskQueue middleware
api.add_middleware(TaskQueueMiddleware)

# Catch unexpected exceptions middleware
api.add_middleware(UnexpectedExceptionMiddleware)

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
