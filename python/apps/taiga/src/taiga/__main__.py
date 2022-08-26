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
from taiga.base.django.commands import call_django_command
from taiga.base.i18n.commands import cli as i18n_cli
from taiga.emails.commands import cli as emails_cli
from taiga.tasksqueue.commands import cli as tasksqueue_cli
from taiga.tasksqueue.commands import run_worker
from taiga.tokens.commands import cli as tokens_cli
from taiga.users.commands import cli as users_cli

cli = typer.Typer(
    name="Taiga Manager",
    help="Manage a Taiga server.",
    add_completion=True,
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

    _run_api(host=host, port=port, access_log=True, use_colors=True, reload=True, debug=True)


@cli.command(help="Run a Taiga server.")
def serve(host: str = typer.Option("0.0.0.0", "--host", "-h"), port: int = typer.Option(8000, "--port", "-p")) -> None:
    _run_api(host=host, port=port, reload=False, debug=False)


@cli.command(help="Load sample data.")
def sampledata() -> None:
    from taiga.base.utils.asyncio import run_async_as_sync
    from taiga.base.utils.sample_data import load_sample_data

    run_async_as_sync(load_sample_data())


##############################################
# Django commands
##############################################


class Verbosity(str, Enum):
    v0 = 0
    v1 = 1
    v2 = 2
    v3 = 3


class FixtureFormat(str, Enum):
    json = "json"
    jsonl = "jsonl"
    yaml = "yaml"
    xml = "xml"


@cli.command(
    help="Run a python shell, initializing the database and the rest of the environment. Tries to use IPython or "
    "bpython, if one of them is available."
)
def shell() -> None:
    call_django_command("shell")


@cli.command(help="Runs the command-line client for specified database, or the default database if none is provided.")
def dbshell() -> None:
    call_django_command("dbshell")


@cli.command(help="Updates database schema. Manages both apps with migrations and those without.")
def migrate(
    fake: bool = typer.Option(False, "--fake/ ", help="Mark migrations as run without actually running them."),
    plan: bool = typer.Option(False, "--plan/ ", help="Shows a list of the migration actions that will be performed."),
    interactive: bool = typer.Option(True, " /--no-input", help="Tells to NOT prompt the user for input of any kind."),
    verbosity: Verbosity = typer.Option(
        "1",
        "--verbosity",
        help="Verbosity level; 0=minimal output, 1=normal output, " "2=verbose output, 3=very verbose output.",
    ),
    app_label: str = typer.Argument("", help="App label of an application to synchronize the state."),
    migration_name: str = typer.Argument("", help="Database state will be brought to the state after that migration. "),
) -> None:
    call_django_command(
        "migrate",
        app_label=app_label,
        migration_name=migration_name,
        fake=fake,
        plan=plan,
        interactive=interactive,
        verbosity=int(verbosity.value),
    )


@cli.command(help="Creates new migration(s) for apps.")
def makemigrations(
    name: str = typer.Option("", "--name", "-n", help="Use this name for migration file(s)."),
    dry_run: bool = typer.Option(
        False, "--dry-run/ ", help="Just show what migrations would be made; don't actually write them."
    ),
    merge: bool = typer.Option(False, "--merge/ ", help="Enable fixing of migration conflicts."),
    empty: bool = typer.Option(False, "--empty/ ", help="Create an empty migration."),
    include_header: bool = typer.Option(
        True, " /--no-header", help="Do not add header comments to new migration file(s)."
    ),
    check_changes: bool = typer.Option(
        False, "--check/ ", help="Exit with a non-zero status if model changes are missing migrations."
    ),
    interactive: bool = typer.Option(True, " /--no-input", help="Tells to NOT prompt the user for input of any kind."),
    verbosity: Verbosity = typer.Option(
        "1",
        "--verbosity",
        help="Verbosity level; 0=minimal output, 1=normal output, " "2=verbose output, 3=very verbose output.",
    ),
    app_label: Optional[list[str]] = typer.Argument(None, help="Specify the app label(s) to create migrations for."),
) -> None:
    call_django_command(
        "makemigrations",
        app_label,
        dry_run=dry_run,
        merge=merge,
        empty=empty,
        interactive=interactive,
        include_header=include_header,
        check_changes=check_changes,
        verbosity=int(verbosity.value),
    )


@cli.command(help="Squashes an existing set of migrations (from first until specified) into a single new one.")
def squashmigrations(
    squashed_name: Optional[str] = typer.Option(None, help="Sets the name of the new squashed migration."),
    optimize: bool = typer.Option(True, " /--no-optimize", help="Do not try to optimize the squashed operations."),
    include_header: bool = typer.Option(
        True, " /--no-header", help="Do not add header comments to new migration file(s)."
    ),
    verbosity: Verbosity = typer.Option(
        "1",
        "--verbosity",
        help="Verbosity level; 0=minimal output, 1=normal output, " "2=verbose output, 3=very verbose output.",
    ),
    app_label: str = typer.Argument(..., help="App label of the application to squash migrations for"),
    start_migration_name: str = typer.Argument(
        ..., help="Migrations will be squashed starting from and including this migration"
    ),
    end_migration_name: str = typer.Argument(
        ..., help="Migrations will be squashed until and including this migration."
    ),
) -> None:
    call_django_command(
        "squashmigrations",
        app_label,
        start_migration_name,
        end_migration_name,
        squashed_name=squashed_name,
        no_optimize=not optimize,
        include_header=include_header,
        verbosity=int(verbosity.value),
    )


@cli.command(help="Shows all available migrations for the current project")
def showmigrations(
    list: bool = typer.Option(
        True,
        "--list / ",
        "-l",
        help="Shows a list of all migrations and which are applied. With a verbosity level of 2 or above, the applied "
        "datetimes will be included.",
    ),
    plan: bool = typer.Option(
        False,
        "--plan / ",
        "-p",
        help="Shows all migrations in the order they will be applied. With a verbosity level of 2 or above all direct "
        "migration dependencies and reverse dependencies (run_before) will be included.",
    ),
    verbosity: Verbosity = typer.Option(
        "1",
        "--verbosity",
        help="Verbosity level; 0=minimal output, 1=normal output, " "2=verbose output, 3=very verbose output.",
    ),
    app_label: Optional[list[str]] = typer.Argument(None, help="Specify the app label(s) to create migrations for."),
) -> None:
    call_django_command(
        "showmigrations",
        app_label,
        format="plan" if plan else "list",
        verbosity=int(verbosity.value),
    )


@cli.command(help="Installs the named fixture(s) in the database.")
def loadfixtures(
    verbosity: Verbosity = typer.Option(
        "1",
        "--verbosity",
        help="Verbosity level; 0=minimal output, 1=normal output, " "2=verbose output, 3=very verbose output.",
    ),
    fixture: list[str] = typer.Argument(..., help="Fixture labels."),
) -> None:
    call_django_command(
        "loaddata",
        fixture,
        verbosity=int(verbosity.value),
    )


@cli.command(help="Output the contents of the database as a fixture of the given format.")
def dumpfixtures(
    format: FixtureFormat = typer.Option(
        "json",
        "--format",
        help="Specifies the output serialization format for fixtures.",
    ),
    indent: int = typer.Option(
        2,
        "--indent",
        help="Specifies the indent level to use when pretty-printing output.",
    ),
    primary_keys: Optional[str] = typer.Option(
        None,
        "--pks",
        help="Only dump objects with given primary keys. accepts a comma-separated list of keys. this option only "
        "works when you specify one model.",
    ),
    verbosity: Verbosity = typer.Option(
        "1",
        "--verbosity",
        help="Verbosity level; 0=minimal output, 1=normal output, " "2=verbose output, 3=very verbose output.",
    ),
    app_label: Optional[list[str]] = typer.Argument(
        None,
        help="Restricts dumped data to the specified 'app_label' or 'app_label.ModelName'. "
        "Empty means 'all models'.",
    ),
) -> None:
    call_django_command(
        "dumpdata",
        app_label,
        format=format,
        indent=indent,
        primary_keys=primary_keys,
        verbosity=int(verbosity.value),
    )


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
