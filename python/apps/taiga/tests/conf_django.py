# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


import os

from taiga.base.django.settings import *  # noqa
from taiga.base.django.settings import INSTALLED_APPS

DEBUG = True

MEDIA_ROOT = "/tmp/taiga/media"
STATIC_ROOT = "/tmp/taiga/static"


INSTALLED_APPS += [
    "tests.samples.occ",
]


# This is only for GitHubActions
if os.getenv("GITHUB_WORKFLOW"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": "taiga",
            "USER": "postgres",
            "PASSWORD": "postgres",
            "HOST": "localhost",
            "PORT": "5432",
        }
    }
