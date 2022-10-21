# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.base.serializers import BaseModel
from taiga.workflows.serializers.nested import WorkflowStatusNestedSerializer


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
    prev: int | None
    next: int | None

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
