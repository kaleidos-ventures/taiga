# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


from taiga6.permissions import choices

PROJECT_ADMIN_PERMISSIONS = [x for x, _ in choices.PROJECT_ADMIN_PERMISSIONS]
WORKSPACE_ADMIN_PERMISSIONS = [x for x, _ in choices.WORKSPACE_ADMIN_PERMISSIONS]
PROJECT_PERMISSIONS = [x for x, _ in choices.PROJECT_PERMISSIONS]
WORKSPACE_PERMISSIONS = [x for x, _ in choices.WORKSPACE_PERMISSIONS]
ANON_PERMISSIONS = [x for x, _ in choices.ANON_PERMISSIONS]


VALID_PROJECT_CHOICES = set(PROJECT_ADMIN_PERMISSIONS + PROJECT_PERMISSIONS + ANON_PERMISSIONS)
