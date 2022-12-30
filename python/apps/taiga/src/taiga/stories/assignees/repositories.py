# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from asgiref.sync import sync_to_async
from taiga.stories.assignees.models import StoryAssignees
from taiga.stories.stories.models import Story
from taiga.users.models import User

##########################################################
# create story assignees
##########################################################


@sync_to_async
def create_story_assignees(story: Story, user: User) -> StoryAssignees:
    return StoryAssignees.objects.create(story=story, user=user)
