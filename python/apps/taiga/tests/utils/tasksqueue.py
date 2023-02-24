# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from procrastinate.testing import JobRow
from taiga.tasksqueue.manager import TasksQueueManager, app


class TestTasksQueueManager(TasksQueueManager):
    def __init__(self) -> None:
        super().__init__(app)
        self.reset()

    @property
    def jobs(self) -> dict[int, JobRow]:
        return self._app.connector.jobs  # type: ignore[attr-defined]

    @property
    def pending_jobs(self) -> list[JobRow]:
        return [job for job in self.jobs.values() if job["status"] not in ["failed", "succeeded"]]

    @property
    def finished_jobs(self) -> list[JobRow]:
        return [job for job in self.jobs.values() if job["status"] in ["failed", "succeeded"]]

    @property
    def failed_jobs(self) -> list[JobRow]:
        return [job for job in self.jobs.values() if job["status"] == "failed"]

    @property
    def succeeded_jobs(self) -> list[JobRow]:
        return [job for job in self.jobs.values() if job["status"] == "succeeded"]

    async def run_pending_jobs(self) -> None:
        await self.run_worker(wait=False)

    def reset(self) -> None:
        self._app.connector.reset()  # type: ignore[attr-defined]


@pytest.fixture
def tqmanager() -> TestTasksQueueManager:
    return TestTasksQueueManager()
