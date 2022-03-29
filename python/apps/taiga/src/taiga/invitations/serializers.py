# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from pydantic import EmailStr
from taiga.base.serializer import BaseModel


class InvitationSerializer(BaseModel):
    user_id: int | None = None
    project_id: int
    role_id: int
    email: EmailStr

    class Config:
        orm_mode = True
