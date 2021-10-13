# -*- coding: utf-8 -*-
# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import re

from taiga6.settings.common import *  # noqa

from . import settings

SECRET = settings.SECRET_KEY

DEBUG = settings.DEBUG

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": settings.DB_NAME,
        "USER": settings.DB_USER,
        "PASSWORD": settings.DB_PASSWORD,
        "HOST": settings.DB_HOST,
        "PORT": settings.DB_PORT,
    }
}

SITES = {
    "api": {
        "name": "api",
        "scheme": settings.BACKEND_URL.scheme,
        "domain": re.sub(r"(?i)(http|https):\/\/", "", settings.BACKEND_URL),
    },
    "front": {
        "name": "front",
        "scheme": settings.FRONTEND_URL.scheme,
        "domain": re.sub(r"(?i)(http|https):\/\/", "", settings.FRONTEND_URL),
    },
}

MEDIA_URL = f"{ settings.BACKEND_URL }/media/"
STATIC_URL = f"{ settings.BACKEND_URL }/static/"
