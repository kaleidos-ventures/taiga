# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from django.utils.translation import ugettext_lazy as _

# default permissions for project administrators
# these permissions cannot be changed with the API
ADMINS_PERMISSIONS = [
    # Workspace  permissions
    ('view_workspace', _('View workspace')),
    # Project permissions
    ('view_project', _('View project')),
    # US permissions
    ('view_us', _('View user story')),
    # Task permissions
    ('view_tasks', _('View tasks')),
]

# default permissions for workspace administrators
# these permissions cannot be changed with the API
WORKSPACE_ADMINS_PERMISSIONS = [
    # Workspace permissions
    ('view_workspace', _('View workspace')),
    ('modify_workspace', _('Modify workspace')),
    ('delete_workspace', _('Delete workspace')),
    ('view_project', _('View project')),
    ##################################
    # Edit project objects permissions
    ##################################
    # US permissions
    ('view_us', _('View user story')),
    # Task permissions
    ('view_tasks', _('View tasks')),
]

# default permissions for project members, applied to default "general members" project role
# these may be changed by a project admin
MEMBERS_PERMISSIONS = [
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
]

# default permissions for workspace members
# permissions which apply to a project may be changed by a project admin
# permissions which apply to a workspace may be changed by a workspace admin
WORKSPACE_MEMBERS_PERMISSIONS = [
    # Workspace permissions
    ('view_workspace', _('View workspace')),
]

# anonymous users
# permissions which apply to a project may be changed by a project admin
ANON_PERMISSIONS = []
