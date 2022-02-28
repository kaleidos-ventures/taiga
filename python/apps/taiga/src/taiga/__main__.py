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


import os
from multiprocessing import Process
from typing import Any

import typer
import uvicorn
from taiga import __version__
from taiga.base.django import setup_django
from taiga.emails.commands import cli as emails_cli
from taiga.tasksqueue.commands import cli as tasksqueue_cli
from taiga.tasksqueue.commands import run_worker

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
    setup_django()


# Load module commands
cli.add_typer(emails_cli, name="emails")
cli.add_typer(tasksqueue_cli, name="tasksqueue")


@cli.command(help="Load sample data.")
def sampledata() -> None:
    from taiga.base.utils.asyncio import run_async_as_sync
    from taiga.base.utils.sample_data import load_sample_data

    run_async_as_sync(load_sample_data())


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


if __name__ == "__main__":
    cli()
