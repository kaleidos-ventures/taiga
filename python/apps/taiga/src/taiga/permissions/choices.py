# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.db.models import TextChoices


class EditStoryPermissions(TextChoices):
    ADD_STORY = "add_story", "Add story"
    COMMENT_STORY = "comment_story", "Comment story"
    DELETE_STORY = "delete_story", "Delete story"
    MODIFY_STORY = "modify_story", "Modify story"


class EditTaskPermissions(TextChoices):
    ADD_TASK = "add_task", "Add task"
    COMMENT_TASK = "comment_task", "Comment task"
    DELETE_TASK = "delete_task", "Delete task"
    MODIFY_TASK = "modify_task", "Modify task"


# possible permissions for members or public members
# directly applied to default "general" project role
# these may be changed by a project admin
# also, permissions for ws-admins
class ProjectPermissions(TextChoices):
    # Story permissions
    ADD_STORY = "add_story", "Add story"
    COMMENT_STORY = "comment_story", "Comment story"
    DELETE_STORY = "delete_story", "Delete story"
    MODIFY_STORY = "modify_story", "Modify story"
    VIEW_STORY = "view_story", "View story"
    # Task permissions
    ADD_TASK = "add_task", "Add task"
    COMMENT_TASK = "comment_task", "Comment task"
    DELETE_TASK = "delete_task", "Delete task"
    MODIFY_TASK = "modify_task", "Modify task"
    VIEW_TASK = "view_task", "View task"


# possible permissions for workspace members
# these may be changed by a workspace admin
class WorkspacePermissions(TextChoices):
    # Global permissions
    VIEW_WORKSPACE = "view_workspace", "View workspace"
