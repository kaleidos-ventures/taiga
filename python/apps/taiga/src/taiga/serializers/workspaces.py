# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from pydantic.schema import datetime
from taiga.base.serializer import BaseModel


class WorkspaceSerializer(BaseModel):
    id: int
    name: str
    slug: str
    color: int
    #TODO: is_owner/is_guest/is_editor when we have user authenticate

    class Config:
        orm_mode = True
