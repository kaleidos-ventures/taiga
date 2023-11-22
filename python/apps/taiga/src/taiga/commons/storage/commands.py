# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from datetime import timedelta

import typer
from taiga.base.utils import pprint
from taiga.base.utils.concurrency import run_async_as_sync
from taiga.base.utils.datetime import aware_utcnow
from taiga.commons.storage import services as storage_services
from taiga.conf import settings

cli = typer.Typer(
    name="Taiga Storage commands",
    help="Manage the starege system of Taiga.",
    add_completion=True,
)


@cli.command(help="Clean deleted storaged object. Remove entries from DB and files from storage")
def clean_storaged_objects(
    days_to_store_deleted_storaged_object: int = typer.Option(
        settings.STORAGE.DAYS_TO_STORE_DELETED_STORAGED_OBJECTS,
        "--days",
        "-d",
        help="Delete all storaged object deleted before the specified days",
    ),
) -> None:
    total_deleted = run_async_as_sync(
        storage_services.clean_deleted_storaged_objects(
            before=aware_utcnow() - timedelta(days=days_to_store_deleted_storaged_object)
        )
    )

    color = "red" if total_deleted else "white"
    pprint.print(f"Deleted [bold][{color}]{total_deleted}[/{color}][/bold] storaged objects.")
