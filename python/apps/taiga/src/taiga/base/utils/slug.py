# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import random

from slugify import slugify as slgf


def generate_username_suffix() -> str:
    return f"{random.randint(0,999):03}"


def slugify(name: str) -> str:
    return slgf(name)
