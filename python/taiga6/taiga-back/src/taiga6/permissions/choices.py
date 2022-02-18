# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from django.utils.translation import gettext_lazy as _


EDIT_US_PERMISSIONS = [
    ('add_us', _('Add US')),
    ('comment_us', _('Comment US')),
    ('delete_us', _('Delete US')),
    ('modify_us', _('Modify US')),
]

EDIT_TASK_PERMISSIONS = [
    ('add_task', _('Add task')),
    ('comment_task', _('Comment task')),
    ('delete_task', _('Delete task')),
    ('modify_task', _('Modify task')),
]

# possible permissions for members or public members
# directly applied to default "general" project role
# these may be changed by a project admin
# also, permissions for ws-admins
PROJECT_PERMISSIONS = [
    # US permissions
    ('add_us', _('Add US')),
    ('comment_us', _('Comment US')),
    ('delete_us', _('Delete US')),
    ('modify_us', _('Modify US')),
    ('view_us', _('View US')),
    # Task permissions
    ('add_task', _('Add task')),
    ('comment_task', _('Comment task')),
    ('delete_task', _('Delete task')),
    ('modify_task', _('Modify task')),
    ('view_tasks', _('View tasks')),
]

# possible permissions for workspace members
# these may be changed by a workspace admin
WORKSPACE_PERMISSIONS = [
    # Workspace permissions
    ('view_workspace', _('View workspace')),
]

# possible permissions for anonymous users
# only "view" permissions at most
# these may be changed by a project admin when changing public-permissions
ANON_PERMISSIONS = [
    # US permissions
    ('view_us', _('View US')),
    # Task permissions
    ('view_tasks', _('View tasks')),
]


