# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from pydantic import validator
from taiga.base.validators import BaseModel


class ProjectMembershipValidator(BaseModel):
    role_slug: str

    @validator("role_slug")
    def check_not_empty(cls, v: str) -> str:
        assert v != "", "Empty field is not allowed"
        return v
