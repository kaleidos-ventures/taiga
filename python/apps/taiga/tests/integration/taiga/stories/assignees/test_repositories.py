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
# create_story_assignees
##########################################################


async def test_create_story_assignee_ok() -> None:
    user = await f.create_user()
    story = await f.create_story()

    story_assignee = await repositories.create_story_assignees(story=story, user=user)

    assert story_assignee.user == user
    assert story_assignee.story == story
