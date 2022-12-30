# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.stories.assignees import repositories as story_assignees_repositories
from taiga.stories.assignees.models import StoryAssignees
from taiga.stories.stories.models import Story
from taiga.users.models import User

##########################################################
# create story assignee
##########################################################


async def create_story_assignees(story: Story, user: User) -> StoryAssignees:
    return await story_assignees_repositories.create_story_assignees(story=story, user=user)
