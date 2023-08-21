# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import os
from pathlib import Path

try:
    import django_stubs_ext

    django_stubs_ext.monkeypatch()
except ImportError:
    pass

from dotenv import load_dotenv  # noqa

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.environ.get("SECRET_KEY")
DEBUG = True


# Application definition

INSTALLED_APPS = [
    # 'django.contrib.admin',
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # taiga
    "taiga.base.db",
    "taiga.emails",
    "taiga.mediafiles",
    "taiga.projects.invitations",
    "taiga.projects.memberships",
    "taiga.projects.projects",
    "taiga.projects.roles",
    "taiga.stories.assignments",
    "taiga.stories.stories",
    "taiga.comments",
    "taiga.tokens",
    "taiga.users",
    "taiga.workflows",
    "taiga.workspaces.invitations",
    "taiga.workspaces.memberships",
    "taiga.workspaces.workspaces",
    # collector
    "taiga_metrics.collector",
]

DATABASE_ROUTERS = ["taiga_metrics.db_routers.telemetries.TelemetriesRouter"]

# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("TELEMETRY_DB_NAME"),
        "USER": os.environ.get("TELEMETRY_DB_USER"),
        "PASSWORD": os.environ.get("TELEMETRY_DB_PASSWORD"),
        "HOST": os.environ.get("TELEMETRY_DB_HOST"),
        "PORT": os.environ.get("TELEMETRY_DB_PORT"),
    },
    "taiga": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("TAIGA_DB_NAME"),
        "USER": os.environ.get("TAIGA_DB_USER"),
        "PASSWORD": os.environ.get("TAIGA_DB_PASSWORD"),
        "HOST": os.environ.get("TAIGA_DB_HOST"),
        "PORT": os.environ.get("TAIGA_DB_PORT"),
    },
}


# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "users.User"
