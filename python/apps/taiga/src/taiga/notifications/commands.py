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
from taiga.conf import settings
from taiga.notifications import services as notifications_services

cli = typer.Typer(
    name="Taiga Notifications commands",
    help="Manage the notifications system of Taiga.",
    add_completion=True,
)


@cli.command(help="Clean read notifications. Remove entries from DB.")
def clean_read_notifications(
    minutes_to_store_read_notifications: int = typer.Option(
        settings.NOTIFICATIONS.MINUTES_TO_STORE_READ_NOTIFICATIONS,
        "--minutes",
        "-m",
        help="Delete all notification read before the specified minutes",
    ),
) -> None:
    total_deleted = run_async_as_sync(
        notifications_services.clean_read_notifications(
            before=aware_utcnow() - timedelta(minutes=minutes_to_store_read_notifications)
        )
    )

    color = "red" if total_deleted else "white"
    pprint.print(f"Deleted [bold][{color}]{total_deleted}[/{color}][/bold] notifications.")
