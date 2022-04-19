# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import logging

import typer
from taiga.emails.emails import Emails
from taiga.emails.render import test_render_html

logger = logging.getLogger(__name__)


cli = typer.Typer(
    name="The Taiga Email Manager",
    help="Manage Taiga emails.",
    add_completion=True,
)


@cli.command(help="Render one email to test it")
def render(email: Emails = typer.Argument(..., case_sensitive=False, help="Name of the email")) -> None:
    test_render_html(email.value)


@cli.command(help="Show available emails")
def list() -> None:
    for email in Emails:
        typer.echo(f"\t{ email.value }")
