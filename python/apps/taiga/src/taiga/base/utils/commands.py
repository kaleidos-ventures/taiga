# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import os
from contextlib import contextmanager
from pathlib import Path
from typing import Generator


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
