# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC
from django.db.models import Model
from taiga.base.api import Pagination
from taiga.comments import repositories as comment_repositories
from taiga.comments.repositories import CommentOrderBy
from taiga.comments.serializers import CommentDetailSerializer
from taiga.comments.serializers import services as comments_serializers

##########################################################
# list comments
##########################################################


async def list_paginated_comments(
    content_object: Model,
    offset: int,
    limit: int,
    order_by: CommentOrderBy = [],
) -> tuple[Pagination, list[CommentDetailSerializer]]:
    filters = {"content_object": content_object}
    comments = await comment_repositories.list_comments(
        filters=filters,
        select_related=["created_by"],
        order_by=order_by,
        offset=offset,
        limit=limit,
    )
    serialized_comments = [comments_serializers.serialize_comment(c) for c in comments]

    total_comments = await comment_repositories.get_total_comments(filters=filters)
    pagination = Pagination(offset=offset, limit=limit, total=total_comments)

    return pagination, serialized_comments
