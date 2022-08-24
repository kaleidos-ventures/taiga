# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from collections.abc import Generator
from contextlib import contextmanager
from typing import Callable, ContextManager

import pytest
from taiga.base.logging import context


@pytest.fixture
def correlation_id() -> Generator[Callable[[str], ContextManager[None]], None, None]:
    """
    Useful to set correlation-id values:

    This is a fixture that return a context manager, so you can use it like this:

        >>>
        async def test_example1(correlation_id):
           ...
           with correlation_id("id-value"):
              ...
           ...
    """

    @contextmanager
    def _correlation_id(value: str) -> Generator[None, None, None]:
        try:
            # Set the value
            token = context.correlation_id.set(value)
            # Run the test
            yield
        finally:
            # Reset the value
            context.correlation_id.reset(token)

    yield _correlation_id
