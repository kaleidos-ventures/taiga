# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from django.utils.translation import ugettext_lazy as _

# possible permissions for project administrators
# these permissions cannot be changed with the API
PROJECT_ADMIN_PERMISSIONS = [
    # Project admin permissions
    ('add_member', _('Add member')),
    ('modify_project', _('Modify project')),
    ('delete_project', _('Delete project')),
]

# possible permissions for workspace administrators
# these permissions cannot be changed with the API
WORKSPACE_ADMIN_PERMISSIONS = [
    # Workspace admin permissions
    ('add_member', _('Add member')),
]

# possible permissions for members or public members
# directly applied to default "general" project role
# these may be changed by a project admin
PROJECT_PERMISSIONS = [
    # Project permissions
    ('view_project', _('View project')),
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
    # Milestone permissions
    ('view_milestones', _('View milestones')),
]

# possible permissions for workspace members
# these may be changed by a workspace admin
WORKSPACE_PERMISSIONS = [
    # Workspace permissions
    ('view_workspace', _('View workspace')),
]

# possible permissions for anonymous users
# only "view" permissions at most
# these may be changed by a project admin
ANON_PERMISSIONS = [
    # Project permissions
    ('view_project', _('View project')),
    # US permissions
    ('view_us', _('View US')),
    # Task permissions
    ('view_tasks', _('View tasks')),
]
