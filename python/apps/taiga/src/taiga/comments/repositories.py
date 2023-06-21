# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Literal, TypedDict

from asgiref.sync import sync_to_async
from taiga.base.db.models import ContentType, Model, QuerySet
from taiga.comments.models import Comment
from taiga.users.models import User

##########################################################
# filters and querysets
##########################################################


DEFAULT_QUERYSET = Comment.objects.all()


class CommentsFilters(TypedDict, total=False):
    content_object: Model


def _apply_filters_to_queryset(
    qs: QuerySet[Comment],
    filters: CommentsFilters = {},
) -> QuerySet[Comment]:
    filter_data = dict(filters.copy())

    if "content_object" in filters:
        content_object = filter_data.pop("content_object")
        filter_data["object_content_type"] = ContentType.objects.get_for_model(content_object)  # type: ignore[arg-type]
        filter_data["object_id"] = content_object.id  # type: ignore[attr-defined]

    return qs.filter(**filter_data)


CommentSelectRelated = list[
    Literal[
        "created_by",
    ]
]


def _apply_select_related_to_queryset(
    qs: QuerySet[Comment],
    select_related: CommentSelectRelated = ["created_by"],
) -> QuerySet[Comment]:
    return qs.select_related(*select_related)


CommentOrderBy = list[
    Literal[
        "created_at",
        "-created_at",
    ]
]


def _apply_order_by_to_queryset(
    qs: QuerySet[Comment],
    order_by: CommentOrderBy,
) -> QuerySet[Comment]:
    return qs.order_by(*order_by)


##########################################################
# create comment
##########################################################


async def create_comment(content_object: Model, text: str, created_by: User) -> Comment:
    return await Comment.objects.acreate(
        text=text,
        created_by=created_by,
        content_object=content_object,
    )


##########################################################
# list comments
##########################################################


@sync_to_async
def list_comments(
    filters: CommentsFilters = {},
    select_related: CommentSelectRelated = [],
    order_by: CommentOrderBy = ["-created_at"],
    offset: int | None = None,
    limit: int | None = None,
) -> list[Comment]:
    qs = _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    qs = _apply_select_related_to_queryset(qs=qs, select_related=select_related)
    qs = _apply_order_by_to_queryset(order_by=order_by, qs=qs)

    if limit is not None and offset is not None:
        limit += offset

    return list(qs[offset:limit])


##########################################################
# misc
##########################################################


@sync_to_async
def get_total_comments(filters: CommentsFilters = {}) -> int:
    qs = _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    return qs.count()
