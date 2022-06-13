# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from pydantic import ValidationError
from taiga.base.api.pagination import PaginationQuery


def test_validate_pagination_invalid_offset(client):
    with pytest.raises(ValidationError, match=r"ensure this value is greater than or equal to 0"):
        PaginationQuery(offset=-1, limit=1)


def test_validate_pagination_invalid_limit(client):
    with pytest.raises(ValidationError, match=r"ensure this value is greater than or equal to 1"):
        PaginationQuery(offset=0, limit=-1)


def test_validate_pagination_exceeded_limit(client):
    with pytest.raises(ValidationError, match=r"ensure this value is less than or equal to 100"):
        PaginationQuery(offset=0, limit=101)


def test_valid_pagination():
    offset = 0
    limit = 10
    pagination = PaginationQuery(offset=offset, limit=limit)

    assert pagination.offset == offset
    assert pagination.limit == limit
