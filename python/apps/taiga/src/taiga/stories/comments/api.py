# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from fastapi import Depends, Query, Response
from taiga.base.api import AuthRequest
from taiga.base.api import pagination as api_pagination
from taiga.base.api import responses
from taiga.base.api.pagination import PaginationQuery
from taiga.base.api.permissions import check_permissions
from taiga.base.validators import B64UUID
from taiga.comments import services as comments_services
from taiga.comments.serializers import CommentSerializer
from taiga.comments.validators import CommentOrderQuery, CreateCommentValidator
from taiga.exceptions.api.errors import ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import HasPerm
from taiga.routers import routes
from taiga.stories.comments import events
from taiga.stories.stories.api import get_story_or_404

# PERMISSIONS
CREATE_STORY_COMMENT = HasPerm("comment_story")
LIST_STORY_COMMENTS = HasPerm("view_story")

# HTTP 200 RESPONSES
COMMENT_200 = responses.http_status_200(model=CommentSerializer)
LIST_COMMENTS_200 = responses.http_status_200(model=list[CommentSerializer])


##########################################################
# create story comment
##########################################################


@routes.comments.post(
    "/projects/{project_id}/stories/{ref}/comments",
    name="project.story.comments.create",
    summary="Create story comment",
    responses=COMMENT_200 | ERROR_403 | ERROR_422 | ERROR_404,
)
async def create_story_comments(
    request: AuthRequest,
    form: CreateCommentValidator,
    project_id: B64UUID = Query(None, description="the project id (B64UUID)"),
    ref: int = Query(None, description="the unique story reference within a project (int)"),
) -> CommentSerializer:
    """
    Add a comment to an story
    """
    story = await get_story_or_404(project_id, ref)
    await check_permissions(permissions=CREATE_STORY_COMMENT, user=request.user, obj=story)

    return await comments_services.create_comment(
        text=form.text,
        project=story.project,
        content_object=story,
        created_by=request.user,
        event_on_create=events.emit_event_when_story_comment_is_created,
    )


##########################################################
# list story comments
##########################################################


@routes.comments.get(
    "/projects/{project_id}/stories/{ref}/comments",
    name="project.story.comments.list",
    summary="List story comments",
    responses=LIST_COMMENTS_200 | ERROR_403 | ERROR_422 | ERROR_404,
)
async def list_story_comments(
    request: AuthRequest,
    response: Response,
    order_params: CommentOrderQuery = Depends(),  # type: ignore
    pagination_params: PaginationQuery = Depends(),
    project_id: B64UUID = Query(None, description="the project id (B64UUID)"),
    ref: int = Query(None, description="the unique story reference within a project (str)"),
) -> list[CommentSerializer]:
    """
    List the story comments
    """

    story = await get_story_or_404(project_id, ref)
    await check_permissions(permissions=LIST_STORY_COMMENTS, user=request.user, obj=story)
    pagination, comments = await comments_services.list_paginated_comments(
        content_object=story,
        offset=pagination_params.offset,
        limit=pagination_params.limit,
        order_by=order_params,
    )
    api_pagination.set_pagination(response=response, pagination=pagination)
    return comments
