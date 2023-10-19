# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.serializers import BaseModel
from taiga.projects.projects.serializers.nested import ProjectLinkNestedSerializer
from taiga.stories.stories.serializers.nested import StoryNestedSerializer
from taiga.users.serializers.nested import UserNestedSerializer


class StoryAssignNotificationContent(BaseModel):
    project: ProjectLinkNestedSerializer
    story: StoryNestedSerializer
    assigned_by: UserNestedSerializer
    assigned_to: UserNestedSerializer

    class Config:
        orm_mode = True


class StoryUnassignNotificationContent(BaseModel):
    project: ProjectLinkNestedSerializer
    story: StoryNestedSerializer
    unassigned_by: UserNestedSerializer
    unassigned_to: UserNestedSerializer

    class Config:
        orm_mode = True
