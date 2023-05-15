# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


################################
# CONSTANTS
################################

# Users
NUM_USER_COLORS = 8

# Workspaces
NUM_WORKSPACE_COLORS = 8

# Projects
NUM_PROJECT_COLORS = 8
PROB_PROJECT_WITH_LOGO = 70  # 0-100

# Stories
STORY_TITLE_MAX_SIZE = ((7,) * 3) + ((15,) * 6) + (50,)  # 7 words (30%), 15 words (60%), 50 words (10%)
NUM_STORIES_PER_WORKFLOW = (0, 30)  # (min, max) by default
PROB_STORY_ASSIGNMENTS = {  # 0-99 prob of a story to be assigned by its workflow status
    "new": 10,
    "ready": 40,
    "in-progress": 80,
    "done": 95,
}
PROB_STORY_ASSIGNMENTS_DEFAULT = 25

# Story Comments
MAX_DAYS_LAST_COMMENT = 12  # referred to the creation date of the story they comment
PROB_STORY_COMMENTS = {  # 0-99 prob of a story to be commented by its workflow status
    "new": 10,
    "ready": 20,
    "in-progress": 40,
    "done": 80,
}
PROB_STORY_COMMENTS_DEFAULT = 25
MAX_STORY_COMMENTS = {  # Max number of comments (in the positive case of having comments)
    "new": 2,
    "ready": 5,
    "in-progress": 10,
    "done": 15,
}
MAX_STORY_COMMENTS_DEFAULT = 5
