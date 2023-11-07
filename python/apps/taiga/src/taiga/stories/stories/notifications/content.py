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


class StoryDeleteNotificationContent(BaseModel):
    projects: ProjectLinkNestedSerializer
    story: StoryNestedSerializer
    deleted_by: UserNestedSerializer

    class Config:
        orm_mode = True


class StoryStatusChangeNotificationContent(BaseModel):
    projects: ProjectLinkNestedSerializer
    story: StoryNestedSerializer
    changed_by: UserNestedSerializer
    status: str

    class Config:
        orm_mode = True


class StoryWorkflowChangeNotificationContent(BaseModel):
    project: ProjectLinkNestedSerializer
    story: StoryNestedSerializer
    changed_by: UserNestedSerializer
    status: str
    workflow: str

    class Config:
        orm_mode = True
