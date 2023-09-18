# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from a2wsgi import WSGIMiddleware
from fastapi import FastAPI
from taiga.base.django.wsgi import application as django_app
from taiga.events import app as events_app
from taiga.events import connect_events_manager, disconnect_events_manager
from taiga.main import api
from taiga.tasksqueue.manager import connect_taskqueue_manager, disconnect_taskqueue_manager

app = FastAPI()

# Mount the new api (v2)
app.mount("/api/v2/", app=api)

# Mount the events service
app.mount("/events/", app=events_app)
app.on_event("startup")(connect_events_manager)
app.on_event("shutdown")(disconnect_events_manager)

# Connect the Task Queue Manager
app.on_event("startup")(connect_taskqueue_manager)
app.on_event("shutdown")(disconnect_taskqueue_manager)

# Serve /media /admin and /static files urls
app.mount("/", WSGIMiddleware(django_app))  # type: ignore
