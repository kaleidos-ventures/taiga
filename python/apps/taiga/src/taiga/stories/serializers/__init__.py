# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from datetime import datetime

from taiga.base.serializers import BaseModel
from taiga.stories.serializers.nested import StoryNeighborSerializer
from taiga.users.serializers.nested import UserNestedSerializer
from taiga.workflows.serializers.nested import WorkflowNestedSerializer, WorkflowStatusNestedSerializer


class StorySerializer(BaseModel):
    ref: int
    title: str
    status: WorkflowStatusNestedSerializer

    class Config:
        orm_mode = True


class StoryDetailSerializer(BaseModel):
    ref: int
    title: str
    status: WorkflowStatusNestedSerializer
    workflow: WorkflowNestedSerializer
    created_by: UserNestedSerializer
    created_at: datetime
    prev: StoryNeighborSerializer | None
    next: StoryNeighborSerializer | None

    class Config:
        orm_mode = True


class ReorderSerializer(BaseModel):
    place: str
    ref: int

    class Config:
        orm_mode = True


class ReorderStoriesSerializer(BaseModel):
    status: WorkflowStatusNestedSerializer
    stories: list[int]
    reorder: ReorderSerializer | None

    class Config:
        orm_mode = True
