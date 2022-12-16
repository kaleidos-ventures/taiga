# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import random

NUM_USER_COLORS = 8


def generate_random_color(min_color: int = 1, max_color: int = NUM_USER_COLORS) -> int:
    return random.randint(min_color, max_color)
