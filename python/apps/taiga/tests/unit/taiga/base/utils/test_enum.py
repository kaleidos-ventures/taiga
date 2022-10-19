# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.base.utils.enum import OrderedEnum


def test_orderedenum_class():
    class Place(OrderedEnum):
        city = "city"
        state = "state"
        country = "country"

    assert Place.state < Place.country
    assert Place.state > Place.city
    assert Place.state == Place.state
