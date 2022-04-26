# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from jinja2 import Environment
from markupsafe import Markup


def _do_wbr_split(text: str, size: int = 70) -> Markup:
    """
    This filter is used to split large strings at ``text`` by introducing the html tag <wbr> every 70 characters, by
    default, according to ``size`` attribute.

    .. sourcecode:: jinja
        {% set long_word = "thisisaverylongword1thisisaverylongword2thisisaverylongword3thisisaver<wbr>ylongword4" -%}
        {{ long_word | wbr_split }}

    .. sourcecode:: html
        thisisaverylongword1thisisaverylongword2thisisaverylongword3thisisaver<wbr>ylongword4

    or with a custom size

    .. sourcecode:: jinja
        {{ "thisisaverylongword" | wbr_split(size=3) }}
        {{ "otherverylongword" | wbr_split(3) }}

    .. sourcecode:: html
        thi<wbr>sis<wbr>ave<wbr>ryl<wbr>ong<wbr>str<wbr>ing
        oth<wbr>erv<wbr>ery<wbr>lon<wbr>gwo<wbr>rd

    """
    return Markup("<wbr>").join([text[x : x + size] for x in range(0, len(text), size)])


def load_filters(env: Environment) -> None:
    env.filters["wbr_split"] = _do_wbr_split
