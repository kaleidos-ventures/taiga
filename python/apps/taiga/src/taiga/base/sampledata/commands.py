# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import typer
from taiga.base.utils.concurrency import run_async_as_sync

cli = typer.Typer(
    name="The Taiga sample data Manager",
    help="Manage Taiga sample data.",
    add_completion=True,
)


@cli.callback(invoke_without_command=True, help="Load sampledata")
def load(
    test: bool = typer.Option(
        True,
        " / --no-test",
        " / -nt",
        help="Not load test data (only demo data)",
    ),
    demo: bool = typer.Option(
        True,
        " / --no-demo",
        " / -nd",
        help="Not load demo data (only test data)",
    ),
) -> None:
    from taiga.base.sampledata.demo_data import load_demo_data
    from taiga.base.sampledata.test_data import load_test_data

    if test:
        run_async_as_sync(load_test_data())

    if demo:
        run_async_as_sync(load_demo_data())
