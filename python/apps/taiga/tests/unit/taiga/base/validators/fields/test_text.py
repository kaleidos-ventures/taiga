# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from pydantic import ValidationError
from taiga.base.validators import BaseModel
from taiga.base.validators.fields.text import StrNotEmpty

#########################################################
# StrNotEmpty
#########################################################


class Model(BaseModel):
    x: StrNotEmpty


def test_str_not_empty_with_valid_value():
    assert Model(x="a").x == "a"


@pytest.mark.parametrize(
    "value",
    ["", "   ", None],
)
def test_str_not_empty_with_invalid_value(value):
    with pytest.raises(ValidationError):
        Model(x=value)
