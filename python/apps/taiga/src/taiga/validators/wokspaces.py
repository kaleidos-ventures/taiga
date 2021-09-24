# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import re
from pydantic import Field, validator
from taiga.base.serializer import BaseModel


class WorkspaceValidator(BaseModel):
    name: str
    color: int

    @validator('name')
    def check_name_not_empty(cls, v):
        assert v != '', 'Empty name is not allowed.'
        return v

    @validator('name')
    def check_allowed_characters(cls, v):
        assert re.fullmatch("^[a-zA-Z0-9 \-]+$", v), 'Character not allowed.'
        return v

    @validator('name')
    def check_name_length(cls, v):
        assert len(v) <= 40, 'Name too long'
        return v

    @validator('color')
    def check_allowed_color(cls, v):
        assert v >= 1 and v <= 8, 'Color not allowed.'
        return v
