# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import logging
import sys
from copy import copy
from typing import Callable, Literal

import typer


class ColourizedFormatter(logging.Formatter):
    """
    A custom log formatter class, based on uvicorn.logging.ColourizedFormatter.
    (https://github.com/encode/uvicorn/blob/master/uvicorn/logging.py)
    """

    level_name_colors: dict[int, Callable[[str], str]] = {
        logging.DEBUG: lambda level_name: typer.style(level_name, fg="cyan"),
        logging.INFO: lambda level_name: typer.style(level_name, fg="green"),
        logging.WARNING: lambda level_name: typer.style(level_name, fg="yellow"),
        logging.ERROR: lambda level_name: typer.style(level_name, fg="red"),
        logging.CRITICAL: lambda level_name: typer.style(level_name, fg="bright_red"),
    }

    def __init__(
        self,
        fmt: str | None = None,
        datefmt: str | None = None,
        style: Literal["%"] | Literal["{"] | Literal["$"] = "%",
        use_colors: bool | None = None,
    ):
        if use_colors in (True, False):
            self.use_colors = use_colors
        else:
            self.use_colors = sys.stdout.isatty()
        super().__init__(fmt=fmt, datefmt=datefmt, style=style)

    def color_level_name(self, level_name: str, level_no: int) -> str:
        func = self.level_name_colors.get(level_no, lambda s: s)
        return func(str(level_name))

    def should_use_colors(self) -> bool:
        return True  # pragma: no cover

    def formatMessage(self, record: logging.LogRecord) -> str:
        recordcopy = copy(record)

        levelname = recordcopy.levelname
        levelname_seperator = " " * (10 - len(levelname))

        if self.use_colors:
            levelname = self.color_level_name(levelname, recordcopy.levelno)

        recordcopy.__dict__["levelprefix"] = f"{levelname}:{levelname_seperator}"
        return super().formatMessage(recordcopy)
