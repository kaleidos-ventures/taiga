# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.db import models
from taiga.comments.models import Comment


class CommentsMixin(models.Model):
    comments = models.GenericRelation(
        Comment,
        content_type_field="object_content_type",
        object_id_field="object_id",
    )

    class Meta:
        abstract = True
