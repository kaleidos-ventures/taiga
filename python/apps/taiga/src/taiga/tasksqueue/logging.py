# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import logging
import sys
from copy import copy
from typing import Any, Callable

import typer
from taiga.base.logging.formatters import ColourizedFormatter


class TaskQueueDefaultFormatter(ColourizedFormatter):
    action_colors: dict[str, Callable[[Any], str]] = {
        "start": lambda action: typer.style(action, fg="bright_yellow"),
        "success": lambda action: typer.style(action, fg="bright_green"),
        "defer": lambda action: typer.style(action, fg="bright_magenta"),
        "default": lambda action: typer.style(action, fg="white"),
    }

    def should_use_colors(self) -> bool:
        return sys.stderr.isatty()  # pragma: no cover

    def _color_action(self, action: str) -> str:
        def action_type(action: str) -> str:
            if action.startswith("start_"):
                return "start"
            if action.endswith("_success"):
                return "success"
            if action.endswith("_defer"):
                return "defer"
            return "default"

        func = self.action_colors.get(action_type(action), self.action_colors["default"])
        return func(action)

    def formatMessage(self, record: logging.LogRecord) -> str:
        recordcopy = copy(record)

        action = getattr(recordcopy, "action", "")
        action_seperator = " "

        if self.use_colors:
            action = self._color_action(action)

        recordcopy.__dict__["action"] = f"[{typer.style('TQ', bold=True)}: {action}]:{action_seperator}"
        return super().formatMessage(recordcopy)


LOGGING_CONFIG: dict[str, Any] = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "()": "taiga.tasksqueue.logging.TaskQueueDefaultFormatter",
            "fmt": "%(levelprefix)s%(action)s%(message)s",
            "use_colors": None,
        },
    },
    "handlers": {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stderr",
        },
    },
    "loggers": {
        "procrastinate": {"handlers": ["default"], "level": "INFO"},
    },
}


def setup_logging(level: int = logging.INFO) -> None:
    copyconfig = copy(LOGGING_CONFIG)
    copyconfig["loggers"]["procrastinate"]["level"] = logging.getLevelName(level)
    logging.config.dictConfig(copyconfig)
