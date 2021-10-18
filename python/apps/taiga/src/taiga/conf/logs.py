# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(levelname)s \t %(name)s \t %(asctime)s \t pid:%(process)d \t %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "json": {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "format": """
                    asctime: %(asctime)s
                    filename: %(filename)s
                    funcName: %(funcName)s
                    levelname: %(levelname)s
                    lineno: %(lineno)d
                    message: %(message)s
                    module: %(module)s
                    name: %(name)s
                    process: %(process)d
                """,
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {"console": {"formatter": "default", "level": "DEBUG", "class": "logging.StreamHandler"}},
    "loggers": {"taiga": {"level": "INFO", "propagate": False, "handlers": ["console"]}},
}
