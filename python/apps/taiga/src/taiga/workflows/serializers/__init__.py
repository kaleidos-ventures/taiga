# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC
from uuid import UUID

from taiga.base.serializers import BaseModel


class WorkflowStatusSerializer(BaseModel):
    id: UUID
    name: str
    slug: str
    color: int
    order: int

    class Config:
        orm_mode = True


class WorkflowSerializer(BaseModel):
    id: UUID
    name: str
    slug: str
    order: int
    statuses: list[WorkflowStatusSerializer]

    class Config:
        orm_mode = True
