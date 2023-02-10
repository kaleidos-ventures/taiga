#!/usr/bin/env python
# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

# flake8: noqa: E402

from taiga.base.django import setup_django

setup_django()

import os
from enum import Enum
from multiprocessing import Process
from typing import Any, Optional

import typer
import uvicorn
from taiga import __version__
from taiga.base.db.commands import cli as db_cli
from taiga.base.django.commands import call_django_command
from taiga.base.i18n.commands import cli as i18n_cli
from taiga.emails.commands import cli as emails_cli
from taiga.tasksqueue.commands import cli as tasksqueue_cli
from taiga.tasksqueue.commands import run_worker
from taiga.tokens.commands import cli as tokens_cli
from taiga.users.commands import cli as users_cli

cli = typer.Typer(
    name="Taiga Manager", help="Manage a Taiga server.", add_completion=True, pretty_exceptions_enable=False
)


def _version_callback(value: bool) -> None:
    if value:
        typer.echo(f"Taiga {__version__}")
        raise typer.Exit()


@cli.callback()
def main(
    version: bool = typer.Option(
        None,
        "--version",
        callback=_version_callback,
        is_eager=True,
        help="Show version information.",
    )
) -> None:
    ...


# Load module commands
cli.add_typer(db_cli, name="db")
cli.add_typer(emails_cli, name="emails")
cli.add_typer(i18n_cli, name="i18n")
cli.add_typer(tasksqueue_cli, name="tasksqueue")
cli.add_typer(tokens_cli, name="tokens")
cli.add_typer(users_cli, name="users")


def _run_api(**kwargs: Any) -> None:
    wsgi_app = os.getenv("TAIGA_WSGI_APP", "taiga.wsgi:app")
    uvicorn.run(wsgi_app, **kwargs)


@cli.command(help="Run a Taiga server (dev mode).")
def devserve(
    host: str = typer.Option("0.0.0.0", "--host", "-h"),
    port: int = typer.Option(8000, "--port", "-p"),
    with_worker: bool = typer.Option(False, "--worker", "-w"),
) -> None:
    if with_worker:
        worker = Process(target=run_worker)
        worker.start()

    _run_api(host=host, port=port, access_log=True, use_colors=True, reload=True)


@cli.command(help="Run a Taiga server.")
def serve(host: str = typer.Option("0.0.0.0", "--host", "-h"), port: int = typer.Option(8000, "--port", "-p")) -> None:
    _run_api(host=host, port=port, reload=False)


@cli.command(help="Load complete sample data")
def sampledata() -> None:
    from taiga.base.utils.concurrency import run_async_as_sync
    from taiga.base.utils.sample_data import load_demo_data, load_test_data

    run_async_as_sync(load_test_data())
    run_async_as_sync(load_demo_data())


@cli.command(help="Load test data")
def testdata() -> None:
    from taiga.base.utils.concurrency import run_async_as_sync
    from taiga.base.utils.sample_data import load_test_data

    run_async_as_sync(load_test_data())


@cli.command(help="Load demo data")
def demodata() -> None:
    from taiga.base.utils.concurrency import run_async_as_sync
    from taiga.base.utils.sample_data import load_demo_data

    run_async_as_sync(load_demo_data())


class Verbosity(str, Enum):
    v0 = 0
    v1 = 1
    v2 = 2
    v3 = 3


@cli.command(
    help="Run a python shell, initializing the database and the rest of the environment. Tries to use IPython or "
    "bpython, if one of them is available."
)
def shell() -> None:
    call_django_command("shell")


@cli.command(help="Copies or symlinks static files from different locations to the STATIC_ROOT directory.")
def collectstatic(
    dry_run: bool = typer.Option(False, "--dry-run/ ", help="Do everything except modify the filesystem."),
    clear: bool = typer.Option(
        False,
        "--clear/ ",
        help="Clear the existing files using the storage before trying to copy or link the original file.",
    ),
    link: bool = typer.Option(False, "--link/ ", help="Create a symbolic link to each file instead of copying."),
    interactive: bool = typer.Option(True, " /--no-input", help="Tells to NOT prompt the user for input of any kind."),
    verbosity: Verbosity = typer.Option(
        "1",
        "--verbosity",
        help="Verbosity level; 0=minimal output, 1=normal output, " "2=verbose output, 3=very verbose output.",
    ),
) -> None:
    call_django_command(
        "collectstatic",
        dry_run=dry_run,
        clear=clear,
        link=link,
        interactive=interactive,
        verbosity=int(verbosity.value),
    )


if __name__ == "__main__":
    cli()
