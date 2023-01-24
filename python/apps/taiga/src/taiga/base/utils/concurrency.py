# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import asyncio
import functools
from collections.abc import Coroutine
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Callable, TypeVar

import anyio

T = TypeVar("T")


def run_async_as_sync(coroutine: Coroutine[Any, Any, T]) -> T:
    pool = ThreadPoolExecutor(1)
    return pool.submit(asyncio.run, coroutine).result()


async def run_until_first_complete(*args: tuple[Callable[..., Any], dict[str, Any]]) -> None:
    async with anyio.create_task_group() as task_group:

        async def run(func: Callable[[], Coroutine[None, None, None]]) -> None:
            await func()
            task_group.cancel_scope.cancel()

        for func, kwargs in args:
            task_group.start_soon(run, functools.partial(func, **kwargs))
