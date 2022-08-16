# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from collections.abc import Generator
from contextlib import contextmanager
from typing import Any, Callable, ContextManager

import pytest
from taiga.conf import settings


@pytest.fixture
def override_settings(
    monkeypatch: pytest.MonkeyPatch,
) -> Generator[Callable[[dict[str, Any]], ContextManager[None]], None, None]:
    """
    Useful to overrided some settings values:

    This is a fixture that return a context manager, so you can use it like this:

        >>>
        async def test_example1(override_settings):
           ...
           with override_settings({"SECRET_KEY": "TEST_SECRET kEY"}):
              ...
           ...
    """

    @contextmanager
    def _override_settings(settings_values: dict[str, Any]) -> Generator[None, None, None]:
        # Apply changes
        for attr, val in settings_values.items():
            monkeypatch.setattr(settings, attr, val)

        # Run the test
        yield

        # Undo changes
        monkeypatch.undo()

    yield _override_settings
