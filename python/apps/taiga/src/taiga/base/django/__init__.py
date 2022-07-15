# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import os

import django


def setup_django() -> None:
    """
    Initialize django settings and django app so we can use the ORM
    """
    os.environ["DJANGO_SETTINGS_MODULE"] = "taiga.base.django.settings"

    django.setup()
