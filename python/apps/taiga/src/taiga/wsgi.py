# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import os

from fastapi import FastAPI
from starlette.middleware.wsgi import WSGIMiddleware

# initialize taiga6
os.environ["DJANGO_SETTINGS_MODULE"] = "taiga.conf.taiga6"

from taiga6.wsgi import application as taiga6_app  # noqa: E402
from taiga.main import api  # noqa: E402

app = FastAPI()

# Mount the new api (v2)
app.mount("/api/v2/", app=api)

# Serve old api (v1), sitemaps, admin, static and media files urls
app.mount("/", WSGIMiddleware(taiga6_app))
