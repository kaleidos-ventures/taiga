# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any
from uuid import UUID

from taiga.base.api import Pagination
from taiga.base.db.models import Model
from taiga.base.utils.datetime import aware_utcnow
from taiga.comments import repositories as comments_repositories
from taiga.comments.events import EventOnCreateCallable, EventOnDeleteCallable, EventOnUpdateCallable
from taiga.comments.models import Comment
from taiga.comments.notifications import NotificationOnCreateCallable
from taiga.comments.repositories import CommentFilters, CommentOrderBy
from taiga.stories.stories.models import Story
from taiga.users.models import User

##########################################################
# create comment
##########################################################


async def create_comment(
    content_object: Model,
    text: str,
    created_by: User,
    event_on_create: EventOnCreateCallable | None = None,
    notification_on_create: NotificationOnCreateCallable | None = None,
) -> Comment:
    comment = await comments_repositories.create_comment(
        content_object=content_object,
        text=text,
        created_by=created_by,
    )

    if event_on_create:
        await event_on_create(comment=comment)
    if notification_on_create:
        await notification_on_create(comment=comment, emitted_by=created_by)

    return comment


##########################################################
# list comments
##########################################################


async def list_paginated_comments(
    content_object: Model,
    offset: int,
    limit: int,
    order_by: CommentOrderBy = [],
) -> tuple[Pagination, int, list[Comment]]:
    filters: CommentFilters = {"content_object": content_object}
    comments = await comments_repositories.list_comments(
        filters=filters,
        select_related=["created_by", "deleted_by"],
        order_by=order_by,
        offset=offset,
        limit=limit,
    )

    total_comments = await comments_repositories.get_total_comments(filters=filters)
    total_not_deleted_comments = await comments_repositories.get_total_comments(
        filters=filters,
        excludes={"deleted": True},
    )
    pagination = Pagination(offset=offset, limit=limit, total=total_comments)

    return pagination, total_not_deleted_comments, comments


##########################################################
# get comment
##########################################################


async def get_comment(id: UUID, content_object: Model) -> Comment | None:
    return await comments_repositories.get_comment(
        filters={"id": id, "content_object": content_object},
        select_related=["created_by", "deleted_by"],
        prefetch_related=["content_object", "project", "workspace"],
    )


##########################################################
# update comment
##########################################################


async def update_comment(
    story: Story,
    comment: Comment,
    values: dict[str, Any] = {},
    event_on_update: EventOnUpdateCallable | None = None,
) -> Comment:
    updated_comment = await comments_repositories.update_comment(comment=comment, values=values)

    if event_on_update:
        await event_on_update(comment=updated_comment)

    return updated_comment


##########################################################
# delete comment
##########################################################


async def delete_comment(
    comment: Comment,
    deleted_by: User,
    event_on_delete: EventOnDeleteCallable | None = None,
) -> Comment:
    updated_comment = await comments_repositories.update_comment(
        comment=comment,
        values={
            "text": "",
            "deleted_by": deleted_by,
            "deleted_at": aware_utcnow(),
        },
    )

    if event_on_delete:
        await event_on_delete(comment=updated_comment)

    return updated_comment
