# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
from typing import Any

from pydantic import validator
from taiga.base.serializer import BaseModel
from taiga.roles.services import get_num_members_by_role_id


class RoleSerializer(BaseModel):
    id: str
    name: str
    slug: str
    order: int
    num_members: int = 0
    is_admin: bool
    permissions: list[str]

    class Config:
        orm_mode = True

    @validator("num_members")
    def get_num_members(cls, value: Any, values: Any) -> int:
        if values["id"]:
            return get_num_members_by_role_id(values["id"])

        return 0
