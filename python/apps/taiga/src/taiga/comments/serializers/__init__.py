# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from pydantic.schema import datetime
from taiga.base.serializers import BaseModel
from taiga.users.serializers.nested import UserNestedSerializer


class CommentDetailSerializer(BaseModel):
    text: str
    created_at: datetime
    created_by: UserNestedSerializer

    class Config:
        orm_mode = True
