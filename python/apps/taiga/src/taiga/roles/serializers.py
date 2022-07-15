# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.base.serializers import BaseModel
from taiga.users.serializers import UserSerializer


class BaseProjectRoleSerializer(BaseModel):
    name: str
    slug: str
    is_admin: bool

    class Config:
        orm_mode = True


class ProjectRoleSerializer(BaseProjectRoleSerializer):
    order: int
    num_members: int = 0
    permissions: list[str]

    class Config:
        orm_mode = True


class ProjectMembershipSerializer(BaseModel):
    user: UserSerializer
    role: BaseProjectRoleSerializer

    class Config:
        orm_mode = True
