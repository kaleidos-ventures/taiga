# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from pydantic import ValidationError
from taiga.events.actions import PingAction, SignInAction, parse_action_from_text


def test_parse_action_from_text_discover_action_type():
    action_ping = parse_action_from_text("""{ "command": "ping" }""")
    action_signin = parse_action_from_text("""{ "command": "signin", "token": "sometoken" }""")

    assert isinstance(action_ping, PingAction)
    assert isinstance(action_signin, SignInAction)


def test_parse_action_from_text_raise_validation_error():
    with pytest.raises(ValidationError) as e:
        parse_action_from_text("""{ "command": "pong" }""")
    assert e.value.errors()[0]["type"] == "value_error"

    with pytest.raises(ValidationError) as e:
        parse_action_from_text("""{ "command": "signin" }""")
    assert e.value.errors()[0]["type"] == "value_error.missing"
