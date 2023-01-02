# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import patch

import pytest
from taiga.stories.assignees import services
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


#######################################################
# create_story_assignee
#######################################################


async def test_create_story_assignee_ok():
    user = f.build_user()
    story = f.build_story()
    story_assignee = f.build_story_assignee()

    with (
        patch(
            "taiga.stories.assignees.services.story_assignees_repositories", autospec=True
        ) as fake_story_assignee_repo,
    ):
        fake_story_assignee_repo.create_story_assignee.return_value = story_assignee

        await services.create_story_assignee(story=story, user=user)
        fake_story_assignee_repo.create_story_assignee.assert_awaited_once_with(
            story=story,
            user=user,
        )
