# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import functools
from enum import Enum
from typing import Any


@functools.total_ordering
class OrderedEnum(Enum):
    """
    This class is the same as `enum.Enum` but the order of the attributes defined in the child classes will be used
    for sorting.

    .. testsetup::
        class Places(OrderedEnum):
            city = "city"
            state = "state"
            country = "country"

    .. doctest::
        >>> Place.state < Place.country
        True
        >>> Place.state < Place.city
        False
        >>> Place.state == Place.state
        True
    """

    @classmethod
    @functools.lru_cache(None)
    def __members_list__(cls) -> list["OrderedEnum"]:
        return list(cls)

    def __lt__(self, other: Any) -> bool:
        if self.__class__ is other.__class__:
            ml = self.__class__.__members_list__()
            return ml.index(self) < ml.index(other)
        return NotImplemented
