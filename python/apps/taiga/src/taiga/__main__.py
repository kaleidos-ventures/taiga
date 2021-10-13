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
from typing import Any

import typer
import uvicorn
from taiga import __version__

app = typer.Typer(
    name="Taiga Manager",
    help="Manage a Taiga server.",
    add_completion=True,
)


def _version_callback(value: bool) -> None:
    if value:
        typer.echo(f"Taiga {__version__}")
        raise typer.Exit()


@app.callback()
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


def _run(**kwargs: Any) -> None:
    wsgi_app = os.getenv("TAIGA_WSGI_APP", "taiga.wsgi:app")

    uvicorn.run(wsgi_app, **kwargs)


@app.command(help="Run a Taiga server (dev mode).")
def devserve(host: str = typer.Option("0.0.0.0"), port: int = typer.Option(8000)) -> None:
    _run(host=host, port=port, access_log=True, use_colors=True, reload=True, debug=True)


@app.command(help="Run a Taiga server.")
def serve(host: str = typer.Option("0.0.0.0"), port: int = typer.Option(8000)) -> None:
    _run(host=host, port=port, reload=False, debug=False)


if __name__ == "__main__":
    app()
