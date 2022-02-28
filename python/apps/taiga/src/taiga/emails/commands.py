# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import logging

import typer
from taiga.emails.emails import AVAILABLE_EMAILS
from taiga.emails.render import test_render_html

logger = logging.getLogger(__name__)


cli = typer.Typer(
    name="The Taiga Email Manager",
    help="Manage Taiga emails.",
    add_completion=True,
)


@cli.command(help="Render one email to test it")
def render(email_name: str = typer.Argument(None, help="Name of the email")) -> None:
    try:
        test_render_html(email_name)
    except FileNotFoundError:
        error = typer.style(f"There isn't any email named '{ email_name }'. ", fg=typer.colors.RED, bold=True)
        hint = "Hint: check available emails with `python -m taiga emails list`"
        typer.echo(f"{ error }\n{ hint }")


@cli.command(help="Show available emails")
def list() -> None:
    for email in AVAILABLE_EMAILS:
        print(f"{ email }\n")
