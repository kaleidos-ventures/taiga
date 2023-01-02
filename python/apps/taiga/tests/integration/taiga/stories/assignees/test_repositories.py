# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from taiga.stories.assignees import repositories
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# create_story_assignee
##########################################################


async def test_create_story_assignee_ok() -> None:
    user = await f.create_user()
    story = await f.create_story()

    story_assignee, created = await repositories.create_story_assignee(story=story, user=user)

    assert story_assignee.user == user
    assert story_assignee.story == story


##########################################################
# get_story_assignee
##########################################################


async def test_get_story_assignee() -> None:
    story_assignee = await f.create_story_assignee()
    story_assignee_test = await repositories.get_story_assignee(
        filters={"story_id": story_assignee.story.id, "username": story_assignee.user.username},
        select_related=["story", "user"],
    )
    assert story_assignee.user.username == story_assignee_test.user.username
    assert story_assignee.story.id == story_assignee_test.story.id
