# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from django.core.management.base import BaseCommand
from taiga_metrics.collector import services as collector_services


class Command(BaseCommand):
    help = "Generate and store metrics for the day"

    def handle(self, *args, **options) -> None:  # type: ignore[no-untyped-def]
        collector_services.collect_metrics()
