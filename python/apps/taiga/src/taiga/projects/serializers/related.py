# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Optional

from taiga.base.serializer import BaseModel


class ProjectSummarySerializer(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    color: Optional[int] = None

    class Config:
        orm_mode = True
