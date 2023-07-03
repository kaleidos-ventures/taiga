# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.serializers import UUIDB64, BaseModel
from taiga.comments.serializers import CommentSerializer
from taiga.users.serializers.nested import UserNestedSerializer


class CreateStoryCommentContent(BaseModel):
    ref: int
    comment: CommentSerializer


class DeleteStoryCommentContent(BaseModel):
    id: UUIDB64
    ref: int
    deleted_by: UserNestedSerializer
