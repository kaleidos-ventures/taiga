# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import functools
import os
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Callable, Generator

import typer


@contextmanager
def set_working_directory(path: Path) -> Generator[None, None, None]:
    """
    Sets the cwd within the context.

    Args:
        path (Path): The path to the cwd

    Yields:
        None
    """
    origin = Path().absolute()
    try:
        os.chdir(path)
        yield
    finally:
        os.chdir(origin)


def unwrap_typer_param(f: Callable[..., Any]) -> Callable[..., Any]:
    """
    Unwraps the default values from typer.Argument or typer.Option to allow function to be called normally.
    See: https://github.com/tiangolo/typer/issues/279 and https://gitlab.com/boratko/typer-utils
    """
    if f.__defaults__ is None:
        return f
    else:
        patched_defaults = []
        actual_default_observed = False
        for i, value in enumerate(f.__defaults__):
            default_value = value.default if isinstance(value, typer.models.ParameterInfo) else value
            if default_value != ...:
                actual_default_observed = True
                patched_defaults.append(default_value)
            elif actual_default_observed:
                raise SyntaxError("non-default argument follows default argument")
        f.__defaults__ = tuple(patched_defaults)

    @functools.wraps(f)
    def wrapper(*args: Any, **kwargs: Any) -> Callable[..., Any]:
        f.__defaults__ = tuple(patched_defaults)
        return f(*args, **kwargs)

    return wrapper
