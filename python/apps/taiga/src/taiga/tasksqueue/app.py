# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import logging
from typing import Final

from procrastinate import AiopgConnector, App, BaseConnector
from procrastinate.testing import InMemoryConnector
from taiga.base.i18n import i18n
from taiga.base.utils import json
from taiga.base.utils.tests import is_test_running
from taiga.conf import settings

from .logging import setup_logging

ROOT_PACKAGE: Final = "taiga"
TASKS_MODULE_NAME: Final = "tasks"


def initialize_app() -> App:
    if is_test_running():
        setup_logging(logging.ERROR)
        connector: BaseConnector = InMemoryConnector()  # type: ignore[no-untyped-call]
    else:
        setup_logging()
        connector = AiopgConnector(
            dbname=settings.DB_NAME,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            json_dumps=json.dumps,
            json_loads=json.loads,
        )

    return App(connector=connector, import_paths=settings.TASKQUEUE.TASKS_MODULES_PATHS)


app = initialize_app()
i18n.initialize()
