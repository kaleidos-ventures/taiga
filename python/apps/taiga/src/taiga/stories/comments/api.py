# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from uuid import UUID

from fastapi import Depends, Query, Response, status
from taiga.base.api import AuthRequest
from taiga.base.api import pagination as api_pagination
from taiga.base.api.pagination import PaginationQuery
from taiga.base.api.permissions import check_permissions
from taiga.base.validators import B64UUID
from taiga.comments import services as comments_services
from taiga.comments.models import Comment
from taiga.comments.serializers import CommentSerializer
from taiga.comments.validators import CommentOrderQuery, CreateCommentValidator, UpdateCommentValidator
from taiga.exceptions import api as ex
from taiga.exceptions.api.errors import ERROR_403, ERROR_404, ERROR_422
from taiga.permissions import HasPerm, IsProjectAdmin, IsRelatedToTheUser
from taiga.routers import routes
from taiga.stories.comments import events
from taiga.stories.stories.api import get_story_or_404
from taiga.stories.stories.models import Story

# PERMISSIONS
CREATE_STORY_COMMENT = HasPerm("comment_story")
LIST_STORY_COMMENTS = HasPerm("view_story")
UPDATE_STORY_COMMENT = IsRelatedToTheUser("created_by") & HasPerm("comment_story")
DELETE_STORY_COMMENT = IsProjectAdmin() | (IsRelatedToTheUser("created_by") & HasPerm("comment_story"))


##########################################################
# create story comment
##########################################################


@routes.comments.post(
    "/projects/{project_id}/stories/{ref}/comments",
    name="project.story.comments.create",
    summary="Create story comment",
    response_model=CommentSerializer,
    responses=ERROR_403 | ERROR_422 | ERROR_404,
)
async def create_story_comments(
    request: AuthRequest,
    form: CreateCommentValidator,
    project_id: B64UUID = Query(None, description="the project id (B64UUID)"),
    ref: int = Query(None, description="the unique story reference within a project (int)"),
) -> Comment:
    """
    Add a comment to an story
    """
    story = await get_story_or_404(project_id=project_id, ref=ref)
    await check_permissions(permissions=CREATE_STORY_COMMENT, user=request.user, obj=story)

    return await comments_services.create_comment(
        text=form.text,
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
    response_model=list[CommentSerializer],
    responses=ERROR_403 | ERROR_422 | ERROR_404,
)
async def list_story_comments(
    request: AuthRequest,
    response: Response,
    project_id: B64UUID = Query(None, description="the project id (B64UUID)"),
    ref: int = Query(None, description="the unique story reference within a project (str)"),
    pagination_params: PaginationQuery = Depends(),
    order_params: CommentOrderQuery = Depends(),  # type: ignore
) -> list[Comment]:
    """
    List the story comments
    """
    story = await get_story_or_404(project_id=project_id, ref=ref)
    await check_permissions(permissions=LIST_STORY_COMMENTS, user=request.user, obj=story)
    pagination, comments = await comments_services.list_paginated_comments(
        content_object=story,
        offset=pagination_params.offset,
        limit=pagination_params.limit,
        order_by=order_params,
    )
    api_pagination.set_pagination(response=response, pagination=pagination)
    return comments


##########################################################
# update story comments
##########################################################


@routes.comments.patch(
    "/projects/{project_id}/stories/{ref}/comments/{comment_id}",
    name="project.story.comments.update",
    summary="Update story comment",
    response_model=CommentSerializer,
    responses=ERROR_403 | ERROR_422 | ERROR_404,
)
async def update_story_comments(
    request: AuthRequest,
    form: UpdateCommentValidator,
    project_id: B64UUID,
    ref: int,
    comment_id: B64UUID,
) -> Comment:
    """
    Update an story's comment
    """
    story = await get_story_or_404(project_id=project_id, ref=ref)
    comment = await get_story_comment_or_404(comment_id=comment_id, story=story)
    await check_permissions(permissions=UPDATE_STORY_COMMENT, user=request.user, obj=comment)

    values = form.dict(exclude_unset=True)
    return await comments_services.update_comment(
        story=story,
        comment=comment,
        values=values,
        event_on_update=events.emit_event_when_story_comment_is_updated,
    )


##########################################################
# delete story comments
##########################################################


@routes.comments.delete(
    "/projects/{project_id}/stories/{ref}/comments/{comment_id}",
    name="project.story.comments.delete",
    summary="Delete story comment",
    responses=ERROR_404 | ERROR_403,
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_story_comment(
    request: AuthRequest,
    project_id: B64UUID,
    ref: int,
    comment_id: B64UUID,
) -> None:
    """
    Delete a comment
    """
    story = await get_story_or_404(project_id=project_id, ref=ref)
    comment = await get_story_comment_or_404(comment_id=comment_id, story=story)
    await check_permissions(permissions=DELETE_STORY_COMMENT, user=request.user, obj=comment)

    await comments_services.delete_comment(
        comment=comment,
        deleted_by=request.user,
        event_on_delete=events.emit_event_when_story_comment_is_deleted,
    )


################################################
# misc:
################################################


async def get_story_comment_or_404(comment_id: UUID, story: Story) -> Comment:
    comment = await comments_services.get_comment(id=comment_id, content_object=story)
    if comment is None:
        raise ex.NotFoundError(f"Comment {comment_id} does not exist")

    return comment
