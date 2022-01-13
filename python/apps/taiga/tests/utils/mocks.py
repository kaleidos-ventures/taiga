# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import contextlib
from collections.abc import Generator
from typing import Any
from unittest.mock import patch

import taiga.conf
from taiga.conf import Settings


@contextlib.contextmanager
def override_settings(settings_values: dict[str, Any]) -> Generator[None, None, None]:
    """
    Useful to overrided some settings values:

    You can use as a decorator

        >>>
        @override_settings({"SECRET_KEY": "TEST_SECRET kEY"})
        def test_example1():
            ...

    Or a a context manager

        >>>
        def test_example1():
           ...
           with override_settings({"SECRET_KEY": "TEST_SECRET kEY"}):
              ...
           ...
    """
    overrided_settings = Settings.parse_obj(settings_values)

    with (
        patch.object(taiga.conf, "get_settings", lambda: overrided_settings),
        patch.object(taiga.conf, "settings", overrided_settings),
    ):
        yield
