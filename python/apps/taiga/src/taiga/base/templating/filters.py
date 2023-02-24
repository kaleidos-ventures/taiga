# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from datetime import datetime
from typing import Literal
from urllib.parse import urljoin

from jinja2 import Environment
from markupsafe import Markup
from taiga.base.i18n.formatings import datetime as fmt_datetime
from taiga.conf import settings


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


def _format_datetime(value: str | datetime, format: Literal["full", "long", "mediim", "short"] | str = "long") -> str:
    """
    This filter is used to formatting datetime objects or string with a date in iso format.
    The default format is ``long`` but it can be overweite.

    .. sourcecode:: jinja
        <p>{{ '2022-06-22T14:53:07.351464+20:00' | format_datetime }}</p>
        <p>{{ datetime.now() | format_datetime("%b %d, %Y") }}</p>

    .. sourcecode:: html
        <p>February 1, 2023 at 12:15:59 PM UTC</p>
        <p>Jun 22, 2022</p>
    """
    if isinstance(value, str):
        dt = datetime.fromisoformat(value)
    else:
        dt = value

    return fmt_datetime.format_datetime(dt, format=format)


def _static_url(file_path: str) -> str:
    """
    This filter generate a complete URL -- e.g, http://localhost:8000/static/emails/taiga.png --
    based on the static files configuration in the settings module and the relative file path.

    .. sourcecode:: jinja
        <img src="{{ 'emails/logo.png' | static_url }}" alt="" />

    .. sourcecode:: html
        <img src="http://localhost:8000/static/emails/logo.png" alt="" />
    """
    return urljoin(settings.STATIC_URL, file_path)


def load_filters(env: Environment) -> None:
    env.filters["wbr_split"] = _do_wbr_split
    env.filters["format_datetime"] = _format_datetime
    env.filters["static_url"] = _static_url
