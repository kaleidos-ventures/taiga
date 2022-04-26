# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

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
