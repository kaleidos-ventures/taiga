# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from humps import camelize, decamelize
from taiga.base.api.ordering import OrderQuery
from taiga.exceptions.api import ValidationError


def test_validate_ordering_valid_params(client):
    allowed_field_list = ["created_at", "-created_at", "text", "-text"]
    default_ordering_list = ["-created_at"]
    ordering_query = OrderQuery(allowed=allowed_field_list, default=default_ordering_list)

    valid_field_list = ["-createdAt", "text"]
    result = ordering_query.__call__(order=valid_field_list)

    assert result == list(map(decamelize, valid_field_list))


def test_validate_ordering_invalid_params(client):
    allowed_field_list = ["created_at", "-created_at", "text", "-text"]
    default_ordering_list = ["-created_at"]
    ordering_query = OrderQuery(allowed=allowed_field_list, default=default_ordering_list)

    invalid_field = "invalid_field"
    ordering_params = allowed_field_list + [invalid_field]

    with pytest.raises(ValidationError, match=f"Invalid ordering fields: {camelize(invalid_field)}"):
        ordering_query.__call__(order=ordering_params)
