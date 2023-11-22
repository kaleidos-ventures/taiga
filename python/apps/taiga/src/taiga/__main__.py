#!/usr/bin/env python
# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

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
from taiga.base.db.commands import Verbosity as DBVerbosity
from taiga.base.db.commands import cli as db_cli
from taiga.base.db.commands import load_fixtures
from taiga.base.db.commands import migrate as db_migrate
from taiga.base.django.commands import call_django_command
from taiga.base.i18n.commands import cli as i18n_cli
from taiga.base.sampledata.commands import cli as sampledata_cli
from taiga.commons.storage.commands import cli as storage_cli
from taiga.emails.commands import cli as emails_cli
from taiga.notifications.commands import cli as notifications_cli
from taiga.tasksqueue.commands import cli as tasksqueue_cli
from taiga.tasksqueue.commands import init as init_tasksqueue
from taiga.tasksqueue.commands import run_worker, worker
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
cli.add_typer(notifications_cli, name="notifications")
cli.add_typer(sampledata_cli, name="sampledata")
cli.add_typer(storage_cli, name="storage")
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


@cli.command(help="Init and run a Taiga server.")
def init_and_serve(
    host: str = typer.Option("0.0.0.0", "--host", "-h"), port: int = typer.Option(8000, "--port", "-p")
) -> None:
    db_migrate(fake=False, plan=False, run_syncdb=True, verbosity=DBVerbosity.v1, app_label="")
    init_tasksqueue(info=False)
    load_fixtures(fixture=["initial_project_templates"], verbosity=DBVerbosity.v1)
    collectstatic(dry_run=False, clear=True, link=False, interactive=False, verbosity=Verbosity.v0)
    _run_api(host=host, port=port, reload=False)


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
