# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.events.events import Event


def test_event_with_correlation_id(correlation_id):
    event = Event(type="tests", content={})

    assert event.type == "tests"
    assert event.content == {}
    assert event.correlation_id is None


def test_event_without_correlation_id(correlation_id):
    with correlation_id("test-id"):
        event = Event(type="tests", content={})

        assert event.type == "tests"
        assert event.content == {}
        assert event.correlation_id == "test-id"
