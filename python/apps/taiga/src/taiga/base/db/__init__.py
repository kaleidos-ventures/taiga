# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any

from django.contrib.contenttypes.models import ContentType  # noqa
from django.db.models import Model, QuerySet  # noqa


def db_connection_params() -> dict[str, Any]:
    from django.db import connection

    return connection.get_connection_params()
