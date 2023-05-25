# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC
from unittest import IsolatedAsyncioTestCase

import pytest
from taiga.comments import repositories
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# list_story_comments
##########################################################


class ListStoryComments(IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.user = await f.create_user()
        self.story1 = await f.create_story()
        self.story2 = await f.create_story()
        self.comment11 = await f.create_story_comment(content_object=self.story1, created_by=self.user, text="11")
        self.comment12 = await f.create_story_comment(content_object=self.story1, created_by=self.user, text="12")
        self.comment2 = await f.create_story_comment(content_object=self.story2, created_by=self.user, text="13")

    async def test_list_story_comments_by_story(self):
        response = await repositories.list_comments(
            filters={"content_object": self.story1},
        )
        assert len(response) == 2
        assert self.comment11 in response
        assert self.comment12 in response


##########################################################
# misc - get_total_story_comments
##########################################################


async def test_get_total_story_comments_ok():
    story1 = await f.create_story()
    story2 = await f.create_story()
    await f.create_story_comment(content_object=story1)
    await f.create_story_comment(content_object=story1)
    await f.create_story_comment(content_object=story2)

    response = await repositories.get_total_comments(filters={"content_object": story1})
    assert response == 2
