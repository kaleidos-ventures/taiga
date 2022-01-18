# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.base.serializer import BaseModel


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
