# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import logging
from collections.abc import Generator
from contextlib import contextmanager
from typing import TYPE_CHECKING

import typer

from .logging import setup_logging

if TYPE_CHECKING:
    from .manager import TasksQueueManager


cli = typer.Typer(
    name="The Taiga TasksQueue Manager",
    help="Manage the Taiga Tasks Queue services.",
    add_completion=True,
)


@contextmanager
def tqmanager() -> Generator["TasksQueueManager", None, None]:
    """
    This contextmanager lazy loads the App, initializes and close the connection pool.

    (This is required so that the entire application is initialized when the autodiscover
    for tasks are performed)
    """

    from .manager import manager as tqm

    tqm.open_sync()
    yield tqm
    tqm.close_sync()


@cli.command(help="Load Taiga TasksQueue DB schema")
def init(info: bool = typer.Option(False, "--info", "-i", help="Only show info about db migrations")) -> None:
    with tqmanager() as tqm:
        if info:
            typer.echo(tqm.migration_schema)
        else:
            typer.echo("Initialize Tasks Queue database... ", nl=False)
            if not tqm.is_migration_applied:
                try:
                    tqm.migrate()
                    typer.secho("OK", fg="bright_green", bold=True)
                except Exception as e:
                    typer.echo(f"Unknown error applying procrastinate migrations: {e}")
            else:
                typer.secho("PASS [The db schema is just applied]", fg="bright_yellow", bold=True)


@cli.command(help="Check the state of the TasksQueue setup")
def status() -> None:
    try:
        with tqmanager() as tqm:
            is_migration_applied = tqm.is_migration_applied
            typer.echo("DB connection: ", nl=False)
            typer.secho("OK", fg="bright_green", bold=True)
            typer.echo("DB schema loaded: ", nl=False)
            if is_migration_applied:
                typer.secho("OK", fg="bright_green", bold=True)
            else:
                typer.secho("ERROR", fg="bright_red", bold=True)
                typer.echo(
                    "Connection to the database works but you need to apply the migrations to the database.", err=True
                )
    except Exception:
        typer.echo("DB connection: ", nl=False)
        typer.secho("ERROR", fg="bright_red", bold=True)
        typer.echo("DB schema loaded: ", nl=False)
        typer.secho("UNKNOWN")
        typer.echo(
            "Error connecting to the database. Review your settings and check that the database is working.",
            err=True,
        )


def run_worker(name: str = "worker", concurrency: int = 1, queue_list: list[str] | None = None) -> None:
    with tqmanager() as tqm:
        tqm.run_worker_sync(name=name, concurrency=concurrency, queues=queue_list)


@cli.command(help="Run a TasksQueue worker instance")
def worker(
    name: str = typer.Option("worker", "--name", "-n", help="Name of the worker"),
    concurrency: int = typer.Option(
        1, "--concurrency", "-c", help="Number of parallel asynchronous jobs to process at once"
    ),
    debug: bool = typer.Option(False, "--debug", "-d", help="Set log level to DEBUG (Default log level is INFO)"),
    queues: str = typer.Argument(
        "", help="Names of the queues to listen separate by , (or empty to listen all queues)"
    ),
) -> None:
    level = logging.INFO if not debug else logging.DEBUG
    if level != logging.INFO:
        typer.echo(f"Log level set to {logging.getLevelName(level)}")
        setup_logging(level)

    queue_list = [q.strip() for q in queues.split(",")] if queues else None
    if queue_list is None:
        queue_names = "all queues"
    else:
        queue_names = ", ".join(queue_list)
    typer.echo(f"Launching a worker on {queue_names}")
    run_worker(name=name, concurrency=concurrency, queue_list=queue_list)


@cli.command(help="Run an Administration Shell for the Taiga TasksQueue instance")
def shell() -> None:
    with tqmanager() as tqm:
        tqm.shell()
