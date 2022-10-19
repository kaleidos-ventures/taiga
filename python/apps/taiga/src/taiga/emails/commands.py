# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


from pathlib import Path
from typing import Final

import typer
from taiga.base.i18n import i18n
from taiga.base.utils import json, pprint
from taiga.conf import settings
from taiga.emails import render as email_render
from taiga.emails.emails import EmailPart, Emails

TEMPLATES_PATH: Final[Path] = Path(__file__).resolve().parent.joinpath("templates")  # src/taiga/emails/templates


cli = typer.Typer(
    name="The Taiga Email Manager",
    help="Manage Taiga emails.",
    add_completion=True,
)


@cli.command(help="Show available emails")
def list() -> None:
    for email in Emails:
        typer.echo(f"\t{ email.value }")


@cli.command(help="Render one email part to test it")
def render(
    part: EmailPart = typer.Option(EmailPart.HTML.value, "--part", "-p", help="Part of the email to render."),
    lang: str = typer.Option(
        settings.LANG,
        "--lang",
        "-l",
        help=f"Language used to render. Availables are: {', '.join(i18n.available_languages)}.",
    ),
    email: Emails = typer.Argument(..., case_sensitive=False, help="Name of the email"),
) -> None:
    email_name = email.value

    # Get context
    context_json = TEMPLATES_PATH.joinpath(f"{email_name}.json")
    try:
        with open(context_json) as context_file:
            context = json.loads(context_file.read())
    except FileNotFoundError:
        context = {}

    # Print email parti
    console = pprint.Console()
    with i18n.use(lang):
        match part:
            case EmailPart.SUBJECT:
                syntax = pprint.Syntax(email_render.render_subject(email_name, context), "txt")
                console.print(syntax)
            case EmailPart.TXT:
                syntax = pprint.Syntax(email_render.render_email_txt(email_name, context), "txt")
                console.print(syntax)
            case EmailPart.HTML:
                syntax = pprint.Syntax(email_render.render_email_html(email_name, context), "html")
                console.print(syntax)
