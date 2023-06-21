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
