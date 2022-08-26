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
from taiga.base import templating
from taiga.base.templating import get_environment


@pytest.fixture
def initialize_template_env(
    monkeypatch: pytest.MonkeyPatch,
) -> Generator[Callable[[], ContextManager[None]], None, None]:
    """
    Useful to wotk with an "new" and "clean" Enviroment object at `taiga.base.templating.env`.

    This is a fixture that return context manager, so you can use it like this:

        >>>
        async def test_example1(initialize_template_env):
           ...
           with initialize_template_env():
              ...
           ...
    """

    @contextmanager
    def _initialize_templating_env() -> Generator[None, None, None]:
        # Apply changes
        new_env = get_environment()
        monkeypatch.setattr(templating, "env", new_env)

        # Run the test
        yield

        # Undo changes
        monkeypatch.undo()

    yield _initialize_templating_env
