# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from pydantic import constr, validator
from taiga.base.serializers import BaseModel
from taiga.base.validator import as_form


@as_form
class TaskValidator(BaseModel):
    name: constr(strip_whitespace=True, max_length=80)  # type: ignore
    status: str

    @validator("status")
    def check_not_empty(cls, v: str) -> str:
        assert v != "", "Empty field is not allowed"
        return v
