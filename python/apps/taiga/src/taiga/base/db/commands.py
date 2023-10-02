# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import shutil
from enum import Enum
from pathlib import Path
from typing import Optional

import typer
from django.apps import apps
from django.conf import settings
from taiga.base.django.commands import call_django_command
from taiga.base.utils import pprint

cli = typer.Typer(
    name="The Taiga DB Manager",
    help="Manage the Taiga Database.",
    add_completion=True,
)


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


######################################
# DB SHELL
######################################


@cli.command(help="Runs the command-line client for the database.")
def shell() -> None:
    call_django_command("dbshell")


######################################
# DB MIGRATIONS
######################################


@cli.command(help="Initialize Taiga migrations")
def init_migrations(
    ctx: typer.Context,
    interactive: bool = typer.Option(True, " /--no-input", help="Tells to NOT prompt the user for input of any kind."),
    verbosity: Verbosity = typer.Option(
        "1",
        "--verbosity",
        help="Verbosity level; 0=minimal output, 1=normal output, " "2=verbose output, 3=very verbose output.",
    ),
) -> None:
    app_labels = [
        app.label for app in apps.app_configs.values() if app.name.startswith("taiga.") and app.name != "taiga.base.db"
    ]
    ctx.invoke(
        make_migrations,
        app_label=app_labels,
        interactive=interactive,
        verbosity=verbosity,
    )


@cli.command(help="Creates new migration(s) for apps.")
def make_migrations(
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
def squash_migrations(
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
def show_migrations(
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


@cli.command(help="Updates database schema. Manages both apps with migrations and those without.")
def migrate(
    fake: bool = typer.Option(False, "--fake/ ", help="Mark migrations as run without actually running them."),
    plan: bool = typer.Option(False, "--plan/ ", help="Shows a list of the migration actions that will be performed."),
    run_syncdb: bool = typer.Option(False, "--syncdb/ ", help="Allows creating tables for apps without migrations."),
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
        run_syncdb=run_syncdb,
        interactive=interactive,
        verbosity=int(verbosity.value),
    )


@cli.command(help="Drop Taiga migrations files")
def drop_migrations(
    verbosity: Verbosity = typer.Option(
        "1",
        "--verbosity",
        help="Verbosity level; 0=minimal output, 1=normal output, " "2=verbose output, 3=very verbose output.",
    ),
) -> None:
    # Drop all migrations except taiga.base.db
    src_dir = Path(settings.BASE_DIR)
    for migrations_dir in src_dir.glob("taiga/**/**/*[!db]/migrations/"):
        if verbosity > Verbosity.v1:
            pprint.print(f"- Delete [bold white]{migrations_dir.relative_to(settings.BASE_DIR.parent)}[/bold white]")
        shutil.rmtree(migrations_dir)


######################################
#  FIXTURES
######################################


@cli.command(help="Output the contents of the database as a fixture of the given format.")
def dump_fixtures(
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


@cli.command(help="Installs the named fixture(s) in the database.")
def load_fixtures(
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
