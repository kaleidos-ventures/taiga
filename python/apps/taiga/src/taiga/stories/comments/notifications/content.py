# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.serializers import BaseModel
from taiga.comments.serializers.nested import CommentNestedSerializer
from taiga.projects.projects.serializers.nested import ProjectLinkNestedSerializer
from taiga.stories.stories.serializers.nested import StoryNestedSerializer
from taiga.users.serializers.nested import UserNestedSerializer


class StoryCommentCreateNotificationContent(BaseModel):
    project: ProjectLinkNestedSerializer
    story: StoryNestedSerializer
    commented_by: UserNestedSerializer
    comment: CommentNestedSerializer
