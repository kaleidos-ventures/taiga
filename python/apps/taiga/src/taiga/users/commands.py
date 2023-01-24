# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import logging

import typer
from taiga.base.utils.concurrency import run_async_as_sync
from taiga.users.services import clean_expired_users

logger = logging.getLogger(__name__)


cli = typer.Typer(
    name="The Taiga Users Manager",
    help="Manage Taiga users.",
    add_completion=True,
)


@cli.command(help="Clean expired users")
def clean() -> None:
    run_async_as_sync(clean_expired_users())
