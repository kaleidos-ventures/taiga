# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import FastAPI
from starlette.middleware.wsgi import WSGIMiddleware
from taiga.base.django.wsgi import application as django_app
from taiga.events import app as events_app
from taiga.events import connect_events_manager, disconnect_events_manager
from taiga.main import api

app = FastAPI()

# Mount the new api (v2)
app.mount("/api/v2/", app=api)

# Mount the events service
app.mount("/events/", app=events_app)
app.on_event("startup")(connect_events_manager)
app.on_event("shutdown")(disconnect_events_manager)

# Serve /media /admin and /static files urls
app.mount("/", WSGIMiddleware(django_app))
