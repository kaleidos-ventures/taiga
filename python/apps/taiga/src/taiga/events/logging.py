# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import logging
import sys
from copy import copy
from typing import Any, Callable

import typer
from taiga.base.logging.formatters import ColourizedFormatter


class EventsDefaultFormatter(ColourizedFormatter):
    action_colors: dict[str, Callable[[Any], str]] = {
        "register": lambda action: typer.style(action, fg="green"),
        "unregister": lambda action: typer.style(action, fg="magenta"),
        "subscribe": lambda action: typer.style(action, fg="yellow"),
        "unsubscribe": lambda action: typer.style(action, fg="blue"),
        "publish": lambda action: typer.style(action, fg="bright_green"),
        "emit": lambda action: typer.style(action, fg="bright_blue"),
        "default": lambda action: typer.style(action, fg="white"),
    }

    def should_use_colors(self) -> bool:
        return sys.stderr.isatty()  # pragma: no cover

    def _color_action(self, action: str) -> str:
        def action_type(action: str) -> str:
            if action.endswith("unregister"):
                return "unregister"
            if action.endswith("register"):
                return "register"
            if action.endswith("unsubscribe"):
                return "unsubscribe"
            if action.endswith("subscribe"):
                return "subscribe"
            if action.endswith("publish"):
                return "publish"
            if action.endswith("emit"):
                return "emit"
            return "default"

        func = self.action_colors.get(action_type(action), self.action_colors["default"])
        return func(action)

    def formatMessage(self, record: logging.LogRecord) -> str:
        recordcopy = copy(record)

        action = getattr(recordcopy, "action", "")
        action_seperator = " "

        if self.use_colors:
            action = self._color_action(action)

        recordcopy.__dict__["action"] = f"[{typer.style('EV', bold=True, fg='yellow')}: {action}]:{action_seperator}"
        return super().formatMessage(recordcopy)


LOGGING_CONFIG: dict[str, Any] = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "()": "taiga.events.logging.EventsDefaultFormatter",
            "fmt": "%(levelprefix)s%(action)s%(message)s",
            "use_colors": None,
        },
    },
    "handlers": {
        "console": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stderr",
        },
    },
    "loggers": {
        "taiga.events": {"handlers": ["console"], "propagate": False, "level": "INFO"},
    },
}


def setup_logging(level: int = logging.INFO) -> None:
    copyconfig = copy(LOGGING_CONFIG)
    copyconfig["loggers"]["taiga.events"]["level"] = logging.getLevelName(level)
    logging.config.dictConfig(copyconfig)
