# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any

from procrastinate.tasks import Task as ProcrastinateTask


class Task:
    _task: ProcrastinateTask

    def __init__(self, task: ProcrastinateTask) -> None:
        self._task = task

    def __call__(self, *args: Any, **kwargs: Any) -> Any:
        return self._task.__call__(*args, **kwargs)

    def defer_sync(self, **kwargs: Any) -> int:
        return self._task.defer(**kwargs)

    async def defer(self, **kwargs: Any) -> int:
        return await self._task.defer_async(**kwargs)
