# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.serializers import BaseModel
from taiga.users.serializers.nested import UserNestedSerializer


class CreateStoryContent(BaseModel):
    from taiga.stories.stories.serializers import StoryDetailSerializer

    story: StoryDetailSerializer


class UpdateStoryContent(BaseModel):
    from taiga.stories.stories.serializers import StoryDetailSerializer

    story: StoryDetailSerializer
    updates_attrs: list[str]


class ReorderStoriesContent(BaseModel):
    from taiga.stories.stories.serializers import ReorderStoriesSerializer

    reorder: ReorderStoriesSerializer


class DeleteStoryContent(BaseModel):
    ref: int
    deleted_by: UserNestedSerializer
