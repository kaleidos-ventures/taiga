# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.base.db.models import TextChoices


class EditUSPermissions(TextChoices):
    ADD_US = "add_us", "Add US"
    COMMENT_US = "comment_us", "Comment US"
    DELETE_US = "delete_us", "Delete US"
    MODIFY_US = "modify_us", "Modify US"


class EditTaskPermissions(TextChoices):
    ADD_STORY = "add_story", "Add story"
    COMMENT_STORY = "comment_story", "Comment story"
    DELETE_STORY = "delete_story", "Delete story"
    MODIFY_STORY = "modify_story", "Modify story"


# possible permissions for members or public members
# directly applied to default "general" project role
# these may be changed by a project admin
# also, permissions for ws-admins
class ProjectPermissions(TextChoices):
    # US permissions
    ADD_US = "add_us", "Add US"
    COMMENT_US = "comment_us", "Comment US"
    DELETE_US = "delete_us", "Delete US"
    MODIFY_US = "modify_us", "Modify US"
    VIEW_US = "view_us", "View US"
    # Task permissions
    ADD_STORY = "add_story", "Add story"
    COMMENT_STORY = "comment_story", "Comment story"
    DELETE_STORY = "delete_story", "Delete story"
    MODIFY_STORY = "modify_story", "Modify story"
    VIEW_STORY = "view_story", "View story"


# possible permissions for workspace members
# these may be changed by a workspace admin
class WorkspacePermissions(TextChoices):
    VIEW_WORKSPACE = "view_workspace", "View workspace"
