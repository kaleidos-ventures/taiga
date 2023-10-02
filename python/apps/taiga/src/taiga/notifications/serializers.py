# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from datetime import datetime

from taiga.base.serializers import UUIDB64, BaseModel, CamelizeDict
from taiga.users.serializers.nested import UserNestedSerializer


class NotificationSerializer(BaseModel):
    id: UUIDB64
    type: str
    created_by: UserNestedSerializer | None
    created_at: datetime
    read_at: datetime | None
    content: CamelizeDict

    class Config:
        orm_mode = True


class NotificationCountersSerializer(BaseModel):
    read: int
    unread: int
    total: int
