# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from pydantic import ValidationError
from taiga.base.serializers.mixins import PaginationMixin
from tests.unit.utils import check_validation_errors


def test_validate_pagination_mixin():
    offset = 0
    limit = 100

    validator = PaginationMixin(offset=offset, limit=limit)

    assert validator.offset == offset
    assert validator.limit == limit


@pytest.mark.parametrize(
    "offset, limit, expected_errors",
    [
        ("text", "project", ["value is not a valid integer"]),
        (-1, -1, ["Incorrect pagination offset", "Incorrect pagination limit"]),
    ],
)
def test_validate_get_users_by_text_invalid_parameters(offset, limit, expected_errors):
    with pytest.raises(ValidationError) as validation_errors:
        PaginationMixin(offset=offset, limit=limit)

    expected_error_fields = ["offset", "limit"]
    expected_error_messages = expected_errors
    check_validation_errors(validation_errors, expected_error_fields, expected_error_messages)
