# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from pydantic import ValidationError
from taiga.base.validators import BaseModel
from taiga.base.validators.fields.i18n import LanguageCode


class Model(BaseModel):
    x: LanguageCode


def test_language_code_with_valid_value():
    m = Model(x="en-US")

    assert m.x == "en-US"


@pytest.mark.parametrize(
    "value",
    ["invalid", "en_us", "", None],
)
def test_language_code_with_invalid_value(value):
    with pytest.raises(ValidationError):
        Model(x=value)
