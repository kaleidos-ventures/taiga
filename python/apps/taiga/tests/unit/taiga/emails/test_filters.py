# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from datetime import datetime, timedelta, timezone

import pytest
from jinja2 import Environment, select_autoescape
from taiga.emails.filters import load_filters

env = Environment(autoescape=select_autoescape())
load_filters(env)


#########################################################################################
# wbr_split
#########################################################################################


@pytest.mark.parametrize(
    "text, result",
    [
        ("thisisalongtext", "thisisalongtext"),
        (
            "thisisalongtext1thisisalongtext2thisisalongtext3thisisalongtext4thisisalongtext",
            "thisisalongtext1thisisalongtext2thisisalongtext3thisisalongtext4thisis<wbr>alongtext",
        ),
    ],
)
def test_wbr_split_with_default_size(text, result):
    template = f"{{{{ '{text}' | wbr_split }}}}"
    assert env.from_string(template).render() == result


@pytest.mark.parametrize(
    "text, size, result",
    [
        ("thisisalongtext", 5, "thisi<wbr>salon<wbr>gtext"),
        ("thisisalongtext", 2, "th<wbr>is<wbr>is<wbr>al<wbr>on<wbr>gt<wbr>ex<wbr>t"),
    ],
)
def test_wbr_split_with_custom_size(text, size, result):
    template = f"{{{{ '{text}' | wbr_split({size}) }}}}"
    assert env.from_string(template).render() == result

    template = f"{{{{ '{text}' | wbr_split(size={size}) }}}}"
    assert env.from_string(template).render() == result


#########################################################################################
# format_datetime
#########################################################################################


@pytest.mark.parametrize(
    "value, result",
    [
        ("2022-06-22T14:53:07.351464+02:00", "22/06/2022 14:53:07 (UTC+02:00)"),
        (
            datetime(2022, 6, 22, 14, 53, 7, 351464, tzinfo=timezone(timedelta(hours=2))),
            "22/06/2022 14:53:07 (UTC+02:00)",
        ),
    ],
)
def test_format_datetime_with_default_format(value, result):
    context = {"value": value}

    template = "{{ value | format_datetime }}"
    assert env.from_string(template).render(**context) == result


@pytest.mark.parametrize(
    "value, format, result",
    [
        ("2022-06-22T14:53:07.351464+02:00", "%b %d, %Y", "Jun 22, 2022"),
        (datetime(2022, 6, 22, 14, 53, 7, 351464, tzinfo=timezone(timedelta(hours=2))), "%b %d, %Y", "Jun 22, 2022"),
    ],
)
def test_format_datetime_with_custom_format(value, format, result):
    context = {"value": value, "format": format}

    template = "{{ value | format_datetime(format) }}"
    assert env.from_string(template).render(**context) == result

    template = "{{ value | format_datetime(format=format) }}"
    assert env.from_string(template).render(**context) == result


#########################################################################################
# static_url
#########################################################################################


def test_static_url(override_settings):
    with override_settings({"STATIC_URL": "http://localhost:8000/static/"}):
        context = {"file": "example/test1.png"}
        template = "{{ file | static_url }}"

        assert env.from_string(template).render(**context) == "http://localhost:8000/static/example/test1.png"

    with override_settings({"STATIC_URL": "https://taiga.company.com/static/"}):
        context = {"file": "example/test2.png"}
        template = "{{ file | static_url }}"

        assert env.from_string(template).render(**context) == "https://taiga.company.com/static/example/test2.png"
