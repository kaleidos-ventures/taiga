# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from pydantic import ValidationError
from taiga.stories.stories.api.validators import ReorderStoriesValidator, ReorderValidator
from tests.utils.bad_params import NOT_EXISTING_B64ID

#######################################################
# ReorderValidator
#######################################################


async def test_reorder_validator_ok():
    assert ReorderValidator(place="after", ref=2)
    assert ReorderValidator(place="before", ref=2)


async def test_reorder_validator_fail():
    with pytest.raises(ValidationError) as exc_info:
        ReorderValidator(place="other", ref=2)
    assert exc_info.value.errors() == [
        {"loc": ("place",), "msg": "Place should be 'after' or 'before'", "type": "assertion_error"}
    ]

    with pytest.raises(ValidationError) as exc_info:
        ReorderValidator()
    assert exc_info.value.errors() == [
        {"loc": ("place",), "msg": "field required", "type": "value_error.missing"},
        {"loc": ("ref",), "msg": "field required", "type": "value_error.missing"},
    ]

    with pytest.raises(ValidationError) as exc_info:
        ReorderValidator(place="after", ref="str")
    assert exc_info.value.errors() == [
        {"loc": ("ref",), "msg": "value is not a valid integer", "type": "type_error.integer"}
    ]


#######################################################
# ReorderStoriesValidator
#######################################################


async def test_reorder_stories_validator_ok():
    reorder = ReorderValidator(place="after", ref=2)
    assert ReorderStoriesValidator(status=NOT_EXISTING_B64ID, stories=[1, 2, 3], reorder=reorder)
    assert ReorderStoriesValidator(status=NOT_EXISTING_B64ID, stories=[1, 2, 3])


async def test_reorder_stories_validator_fail():
    with pytest.raises(ValidationError) as exc_info:
        ReorderStoriesValidator(status=NOT_EXISTING_B64ID, stories=[])
    assert exc_info.value.errors() == [
        {
            "ctx": {"limit_value": 1},
            "loc": ("stories",),
            "msg": "ensure this value has at least 1 items",
            "type": "value_error.list.min_items",
        }
    ]

    with pytest.raises(ValidationError) as exc_info:
        ReorderStoriesValidator(status=None, stories=[1])
    assert exc_info.value.errors() == [
        {"loc": ("status",), "msg": "none is not an allowed value", "type": "type_error.none.not_allowed"}
    ]

    with pytest.raises(ValidationError) as exc_info:
        ReorderStoriesValidator(status=NOT_EXISTING_B64ID, stories=[1], reorder={"place": "nope", "ref": 3})
    assert exc_info.value.errors() == [
        {"loc": ("reorder", "place"), "msg": "Place should be 'after' or 'before'", "type": "assertion_error"}
    ]
