# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import string
from collections import Counter

from pydantic import constr, validator
from taiga.base.validators import BaseModel


class PasswordMixin(BaseModel):
    password: constr(min_length=8, max_length=256)  # type: ignore

    @validator("password")
    def check_password(cls, v: str) -> str:
        has_upper = len(set(string.ascii_uppercase).intersection(v)) > 0
        has_lower = len(set(string.ascii_lowercase).intersection(v)) > 0
        has_number = len(set(string.digits).intersection(v)) > 0
        has_symbol = len(set(string.punctuation).intersection(v)) > 0

        c = Counter([has_upper, has_lower, has_number, has_symbol])
        assert c[True] >= 3, "Invalid password"
        return v
