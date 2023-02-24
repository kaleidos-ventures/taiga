# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.utils.colors import generate_random_color


def test_random_color_default():
    res = generate_random_color()
    assert 0 < res < 9


def test_random_color_custom():
    res = generate_random_color(99, 100)
    assert 98 < res < 101
