# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from unittest.mock import AsyncMock, PropertyMock, patch
from uuid import uuid1

import pytest
from taiga.base.utils.datetime import aware_utcnow
from taiga.comments import services
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


#####################################################
# create_comment
#####################################################


async def test_create_comment():
    story = f.build_story()
    comment = f.build_comment()

    with (patch("taiga.comments.services.comments_repositories", autospec=True) as fake_comments_repositories,):
        fake_comments_repositories.create_comment.return_value = comment

        await services.create_comment(
            content_object=story,
            text=comment.text,
            created_by=comment.created_by,
        )

        fake_comments_repositories.create_comment.assert_awaited_once_with(
            content_object=story,
            text=comment.text,
            created_by=comment.created_by,
        )


async def test_create_comment_and_emit_event_on_creation():
    project = f.build_project()
    story = f.build_story(project=project)
    fake_event_on_create = AsyncMock()
    comment = f.build_comment()

    with (
        patch("taiga.comments.services.comments_repositories", autospec=True) as fake_comments_repositories,
        patch("taiga.comments.models.Comment.project", new_callable=PropertyMock, return_value=project),
    ):
        fake_comments_repositories.create_comment.return_value = comment

        await services.create_comment(
            content_object=story,
            text=comment.text,
            created_by=comment.created_by,
            event_on_create=fake_event_on_create,
        )

        fake_comments_repositories.create_comment.assert_awaited_once_with(
            content_object=story,
            text=comment.text,
            created_by=comment.created_by,
        )
        fake_event_on_create.assert_awaited_once_with(comment=comment)


async def test_create_comment_and_notify_on_creation():
    project = f.build_project()
    story = f.build_story(project=project)
    fake_notification_on_create = AsyncMock()
    comment = f.build_comment()

    with (
        patch("taiga.comments.services.comments_repositories", autospec=True) as fake_comments_repositories,
        patch("taiga.comments.models.Comment.project", new_callable=PropertyMock, return_value=project),
    ):
        fake_comments_repositories.create_comment.return_value = comment

        await services.create_comment(
            content_object=story,
            text=comment.text,
            created_by=comment.created_by,
            notification_on_create=fake_notification_on_create,
        )

        fake_comments_repositories.create_comment.assert_awaited_once_with(
            content_object=story,
            text=comment.text,
            created_by=comment.created_by,
        )
        fake_notification_on_create.assert_awaited_once_with(comment=comment, emitted_by=comment.created_by)


#####################################################
# list_comments
#####################################################


async def test_list_comments():
    story = f.build_story(id="")
    comments = [f.build_comment(), f.build_comment(deleted_by=story.created_by), f.build_comment()]

    filters = {"content_object": story}
    select_related = ["created_by", "deleted_by"]
    order_by = ["-created_at"]
    offset = 0
    limit = 100
    total = 3
    total_objs = 2

    with (patch("taiga.comments.services.comments_repositories", autospec=True) as fake_comments_repositories,):
        fake_comments_repositories.list_comments.return_value = comments
        fake_comments_repositories.get_total_comments.side_effect = [total, total_objs]
        pagination, total_comments, comments_list = await services.list_paginated_comments(
            content_object=story, order_by=order_by, offset=offset, limit=limit
        )
        fake_comments_repositories.list_comments.assert_awaited_once_with(
            filters=filters,
            select_related=select_related,
            order_by=order_by,
            offset=offset,
            limit=limit,
        )
        fake_comments_repositories.get_total_comments.assert_awaited()
        assert len(comments_list) == 3
        assert pagination.offset == offset
        assert pagination.limit == limit
        assert pagination.total == total


##########################################################
# get_coment
##########################################################


async def test_get_comment():
    story = f.build_story(id="story_id")
    comment_id = uuid1()

    with (patch("taiga.comments.services.comments_repositories", autospec=True) as fake_comments_repositories,):
        await services.get_comment(id=comment_id, content_object=story)
        fake_comments_repositories.get_comment.assert_awaited_once_with(
            filters={"id": comment_id, "content_object": story},
            select_related=["created_by", "deleted_by"],
            prefetch_related=["content_object", "project", "workspace"],
        )


##########################################################
# update_coment
##########################################################


async def test_update_comment():
    story = f.build_story()
    comment = f.build_comment()
    updated_text = "Updated text"

    with (patch("taiga.comments.services.comments_repositories", autospec=True) as fake_comments_repositories,):
        fake_comments_repositories.update_comment.return_value = comment

        await services.update_comment(story=story, comment=comment, values={"text": updated_text})

        fake_comments_repositories.update_comment.assert_awaited_once_with(
            comment=comment, values={"text": updated_text}
        )


async def test_update_comment_and_emit_event_on_update():
    project = f.build_project()
    story = f.build_story(project=project)
    comment = f.build_comment()
    updated_text = "Updated text"
    fake_event_on_update = AsyncMock()

    with (
        patch("taiga.comments.services.comments_repositories", autospec=True) as fake_comments_repositories,
        patch("taiga.comments.models.Comment.project", new_callable=PropertyMock, return_value=project),
    ):
        fake_comments_repositories.update_comment.return_value = comment

        await services.update_comment(
            story=story, comment=comment, values={"text": updated_text}, event_on_update=fake_event_on_update
        )

        fake_comments_repositories.update_comment.assert_awaited_once_with(
            comment=comment, values={"text": updated_text}
        )

        fake_event_on_update.assert_awaited_once_with(comment=comment)


##########################################################
# delete_coment
##########################################################


async def test_delete_comment():
    now = aware_utcnow()
    comment = f.build_comment()
    updated_comment = f.build_comment(id=comment.id, text="", deleted_by=comment.created_by, deleted_at=now)

    with (
        patch("taiga.comments.services.comments_repositories", autospec=True) as fake_comments_repositories,
        patch("taiga.comments.services.aware_utcnow", autospec=True) as fake_aware_utcnow,
    ):
        fake_aware_utcnow.return_value = now
        fake_comments_repositories.update_comment.return_value = updated_comment

        assert await services.delete_comment(comment=comment, deleted_by=comment.created_by) == updated_comment

        fake_comments_repositories.update_comment.assert_awaited_once_with(
            comment=comment,
            values={
                "text": updated_comment.text,
                "deleted_by": updated_comment.deleted_by,
                "deleted_at": updated_comment.deleted_at,
            },
        )


async def test_delete_comment_and_emit_event_on_delete():
    now = aware_utcnow()
    comment = f.build_comment()
    updated_comment = f.build_comment(id=comment.id, text="", deleted_by=comment.created_by, deleted_at=now)
    fake_event_on_delete = AsyncMock()

    with (
        patch("taiga.comments.services.comments_repositories", autospec=True) as fake_comments_repositories,
        patch("taiga.comments.services.aware_utcnow", autospec=True) as fake_aware_utcnow,
    ):
        fake_aware_utcnow.return_value = now
        fake_comments_repositories.update_comment.return_value = updated_comment

        assert (
            await services.delete_comment(
                comment=comment,
                deleted_by=comment.created_by,
                event_on_delete=fake_event_on_delete,
            )
            == updated_comment
        )

        fake_comments_repositories.update_comment.assert_awaited_once_with(
            comment=comment,
            values={
                "text": updated_comment.text,
                "deleted_by": updated_comment.deleted_by,
                "deleted_at": updated_comment.deleted_at,
            },
        )
        fake_event_on_delete.assert_awaited_once_with(comment=updated_comment)
