# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC
import pytest
from taiga.base.utils.datetime import aware_utcnow
from taiga.comments import repositories
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# create_comment
##########################################################


async def test_create_comment_associated_to_and_object():
    user = await f.create_user()
    story = await f.create_story(created_by=user)
    text = "some comment example"

    comment = await repositories.create_comment(text=text, content_object=story, created_by=user)

    assert comment.id
    assert comment.text == text
    assert comment.content_object == story
    assert comment.created_by == user
    assert comment.created_at < aware_utcnow()


##########################################################
# list_comments
##########################################################


async def test_list_comments_by_content_object():
    story1 = await f.create_story()
    story2 = await f.create_story()
    comment11 = await f.create_comment(content_object=story1)
    comment12 = await f.create_comment(content_object=story1)
    await f.create_comment(content_object=story2)

    comments = await repositories.list_comments(
        filters={"content_object": story1},
    )
    assert len(comments) == 2
    assert comment11 in comments
    assert comment12 in comments


##########################################################
# get_comment
##########################################################


async def tests_get_comment():
    story1 = await f.create_story()
    story2 = await f.create_story()
    comment11 = await f.create_comment(content_object=story1)
    comment21 = await f.create_comment(content_object=story2)
    comment22 = await f.create_comment(content_object=story2)

    assert await repositories.get_comment(filters={"id": comment22.id}) == comment22
    assert await repositories.get_comment(filters={"content_object": story1}) == comment11
    assert await repositories.get_comment(filters={"content_object": story1, "id": comment21.id}) is None
    assert await repositories.get_comment(filters={"content_object": story1, "id": comment11.id}) == comment11


##########################################################
# update_comment
##########################################################


async def tests_update_comment():
    story = await f.create_story()
    comment = await f.create_comment(content_object=story)
    updated_text = "updated text"

    await repositories.update_comment(comment=comment, values={"text": updated_text})

    assert comment.text == updated_text
    assert comment.modified_at < aware_utcnow()


##########################################################
# delete_comments
##########################################################


async def tests_delete_comments():
    story1 = await f.create_story()
    story2 = await f.create_story()
    await f.create_comment(content_object=story2)
    await f.create_comment(content_object=story2)

    assert await repositories.delete_comments(filters={"content_object": story1}) == 0
    assert await repositories.delete_comments(filters={"content_object": story2}) == 2


##########################################################
# misc - get_total_story_comments
##########################################################


async def test_get_total_comments_by_content_object():
    story1 = await f.create_story()
    story2 = await f.create_story()
    await f.create_comment(content_object=story1)
    await f.create_comment(content_object=story1)
    await f.create_comment(content_object=story2)

    total_comments = await repositories.get_total_comments(filters={"content_object": story1})
    assert total_comments == 2


async def test_get_total_comments_not_deleted():
    story1 = await f.create_story()
    user = await f.create_user()
    await f.create_comment(content_object=story1)
    await f.create_comment(content_object=story1)
    await f.create_comment(content_object=story1, deleted_by=user, deleted_at=aware_utcnow())

    total_comments = await repositories.get_total_comments(
        filters={"content_object": story1},
        excludes={"deleted": True},
    )
    assert total_comments == 2
