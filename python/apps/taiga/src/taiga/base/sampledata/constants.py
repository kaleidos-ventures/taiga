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
STORY_TITLE_MAX_SIZE = ((75,) * 3) + ((200,) * 6) + (400,)  # 75 chars (30%), 200 chars (60%), 400 chars (10%)
NUM_STORIES_PER_WORKFLOW = (0, 30)  # (min, max) by default
PROB_STORY_ASSIGNMENTS = {  # 0-99 prob of a story to be assigned by its workflow status
    "New": 10,
    "Ready": 40,
    "In Progress": 80,
    "Done": 95,
}
PROB_STORY_ASSIGNMENTS_DEFAULT = 25

# Story Comments
MAX_DAYS_LAST_COMMENT = 12  # referred to the creation date of the story they comment
MAX_STORY_COMMENTS = {  # Max number of comments (in the positive case of having comments)
    "New": 2,
    "Ready": 5,
    "In Progress": 10,
    "Done": 15,
}
MAX_STORY_COMMENTS_DEFAULT = 5
PROB_STORY_COMMENTS = {  # 0-99 prob of a story to be commented by its workflow status
    "New": 10,
    "Ready": 20,
    "In Progress": 60,
    "Done": 95,
}
PROB_STORY_COMMENTS_DEFAULT = 25
PROB_MODIFIED_COMMENT = 10  # 0-99 prob of a comment to be modified
PROB_DELETED_COMMENT = 10  # 0-99 prob of a comment to be deleted
