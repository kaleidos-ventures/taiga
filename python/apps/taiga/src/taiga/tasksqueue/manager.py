# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import functools
from enum import Enum
from typing import Any, Callable, Iterable

from procrastinate import App
from procrastinate.shell import ProcrastinateShell

from .app import app
from .task import Task

DEFAULT_QUEUE = "default"


class DeleteJobStrategy(Enum):
    ALWAYS = "always"
    SUCCESSFUL = "successful"
    NEVER = "never"


class TasksQueueManager:
    _app: App

    def __init__(self, app: App) -> None:
        self._app = app

    # Manage broker connections

    async def open(self) -> None:
        """Open a connection with the broker. Async version."""
        await self._app.open_async()

    def open_sync(self) -> None:
        """Open a connection with the broker. Sync version."""
        self._app.open()

    async def close(self) -> None:
        """Close a connection with the broker. Async version."""
        await self._app.close_async()

    def close_sync(self) -> None:
        """Close a connection with the broker. Sync version."""
        self._app.close()

    # Tasks decorators

    def task(
        self, func: Callable[..., Any] | None = None, *, name: str | None = None, queue: str = DEFAULT_QUEUE
    ) -> Any:
        """
        Declare a function as a task. This method is meant to be used as a decorator:

            @tqmanager.task(...)
            def my_task(args):
                ...

        or:

            @tqmanager.task
            def my_task(args):
                ...

        The second form will use the default value for all parameters.

        Parameters
        ----------
        func :
            The decorated function
        name :
            Name of the task, by default the full dotted path to the decorated function.
            if the function is nested or dynamically defined, it is important to give
            it a unique name, and to make sure the module that defines this function
            is listed in the ``import_paths`` of the `procrastinate.App`.
        queue :
            The name of the queue in which jobs from this task will be launched, if
            the queue is not overridden at launch.
            Default is ``"default"``.
            When a worker is launched, it can listen to specific queues, or to all
            queues.
        """

        def wrapper(fn: Callable[..., Any]) -> Task:
            ptask = self._app.task(fn, name=name, queue=queue)
            task = Task(ptask)
            return functools.update_wrapper(task, ptask, updated=())

        if func is None:  # Called as @manager.task(...)
            return wrapper

        return wrapper(func)  # Called as @manager.task

    def periodic(self, *, cron: str, periodic_id: str = "") -> Any:
        """
        Task decorator, marks task as being scheduled for periodic deferring.

            @tqmanager.periodic(cron="1 * * * *")
            @tqmanager.task
            def my_task(timestamp: int):
                ...

        Parameters
        ----------
        cron :
            Cron-like string. Optionally add a 6th column for seconds.
        """

        def wrapper(task: Task) -> Task:
            self._app.periodic_deferrer.register_task(
                task=task._task,
                cron=cron,
                periodic_id=f"periodic/{periodic_id or task._task.name}",
                configure_kwargs={},
            )
            return task

        return wrapper

    # Run workers

    async def run_worker(
        self,
        *,
        name: str = "worker",
        queues: Iterable[str] | None = None,
        concurrency: int = 1,
        delete_jobs: DeleteJobStrategy = DeleteJobStrategy.NEVER,
        wait: bool = True,
    ) -> None:
        """
        Run a worker. This worker will run in the foreground and execute the jobs in the
        provided queues. If wait is True, the function will not return until the worker
        stops (most probably when it receives a stop signal).

        Parameters
        ----------
        name : ``Optional[str]``
            Name of the worker. Will be passed in the `JobContext` and used in the logs
            (defaults to ``None`` which will result in the worker named ``worker``).
        queues : ``Iterable[str] | None``
            List of queues to listen to, or None to listen to every queue (defaults to
            ``None``).
        concurrency : ``int``
            Indicates how many asynchronous jobs the worker can run in parallel.
            Do not use concurrency if you have synchronous blocking tasks
            (defaults to ``1``).
        delete_jobs : ``DeleteJobStrategy``
            If ``DeleteJobStrategy.ALWAYS``, the worker will automatically delete all jobs
            on completion.
            If ``DeleteJobStrategy.SUCCESSFUL`` the worker will only delete successful jobs.
            If ``DeleteJobStrategy.NEVER``, the worker will keep the jobs in the database.
            (defaults to ``DeleteJobStrategy.NEVER``).
        wait : ``bool``
            If ``False``, the worker will terminate as soon as it has caught up with the
            queues. If ``True``, the worker will work until it is stopped by a signal.
            (``ctrl+c``, ``SIGINT``, ``SIGTERM``) (defaults to ``True``).
        """
        await self._app.run_worker_async(
            name=name, queues=queues, concurrency=concurrency, delete_jobs=delete_jobs.value, wait=wait
        )

    def run_worker_sync(
        self,
        *,
        name: str = "worker",
        queues: Iterable[str] | None = None,
        concurrency: int = 1,
        delete_jobs: DeleteJobStrategy = DeleteJobStrategy.NEVER,
        wait: bool = True,
    ) -> None:
        """Run a worker. Sync version."""
        self._app.run_worker(  # type: ignore
            name=name, queues=queues, concurrency=concurrency, delete_jobs=delete_jobs.value, wait=wait
        )

    # Administration features (all are sync)

    @property
    def is_migration_applied(self) -> bool:
        """Check if the migration is applied."""
        return self._app.check_connection()  # type: ignore[attr-defined]

    @property
    def migration_schema(self) -> str:
        """The SQL applied by the migration."""
        return (
            f"{self._app.schema_manager.get_schema()}\n"
            f"MIGRATIONS PATH: {self._app.schema_manager.get_migrations_path()}"
        )

    def migrate(self) -> None:
        """Apply migrations to the database."""
        self._app.schema_manager.apply_schema()

    def shell(self) -> None:
        """Run an Administration Shell for the procastinate instance."""
        ProcrastinateShell(job_manager=self._app.job_manager).cmdloop()


manager = TasksQueueManager(app)


async def connect_taskqueue_manager() -> None:
    await manager.open()


async def disconnect_taskqueue_manager() -> None:
    await manager.close()
