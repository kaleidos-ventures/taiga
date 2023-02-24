# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.serializers import BaseModel


class ProjectRoleNestedSerializer(BaseModel):
    name: str
    slug: str
    is_admin: bool
    permissions: list[str]

    class Config:
        orm_mode = True
