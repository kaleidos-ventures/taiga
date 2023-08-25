# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from uuid import uuid1

import pytest
from pydantic import ValidationError
from taiga.base.utils.uuid import encode_uuid_to_b64str
from taiga.base.validators import BaseModel
from taiga.base.validators.fields.uuid import B64UUID


class Model(BaseModel):
    x: B64UUID


def test_b64uuid_with_valid_value():
    uuid = uuid1()

    m = Model(x=encode_uuid_to_b64str(uuid))

    assert m.x == uuid


@pytest.mark.parametrize(
    "value",
    ["invalid", "AAAshort", "AAAAAAAAAAAAAAAAAAAAAAAAlong", "", None],
)
def test_b64uuid_with_invalid_value(value):
    with pytest.raises(ValidationError):
        Model(x=value)
