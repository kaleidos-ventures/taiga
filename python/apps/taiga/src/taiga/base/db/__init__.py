# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any

from django.db import connection


def db_connection_params() -> dict[str, Any]:
    """Return the current django connection params"""
    return connection.get_connection_params()
