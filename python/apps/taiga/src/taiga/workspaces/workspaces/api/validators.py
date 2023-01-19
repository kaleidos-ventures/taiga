# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from pydantic import conint, constr, validator
from taiga.base.validators import BaseModel


class WorkspaceValidator(BaseModel):
    name: constr(strip_whitespace=True, max_length=40)  # type: ignore
    color: conint(gt=0, lt=9)  # type: ignore

    @validator("name")
    def check_name_not_empty(cls, v: str) -> str:
        assert v != "", "Empty name is not allowed"
        return v
