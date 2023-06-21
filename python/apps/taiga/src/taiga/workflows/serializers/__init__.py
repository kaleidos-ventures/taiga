# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.serializers import UUIDB64, BaseModel
from taiga.workflows.serializers.nested import WorkflowNestedSerializer, WorkflowStatusNestedSerializer


class WorkflowStatusSerializer(BaseModel):
    id: UUIDB64
    name: str
    slug: str
    color: int
    order: int
    workflow: WorkflowNestedSerializer

    class Config:
        orm_mode = True


class WorkflowSerializer(BaseModel):
    id: UUIDB64
    name: str
    slug: str
    order: int
    statuses: list[WorkflowStatusNestedSerializer]

    class Config:
        orm_mode = True
