# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


from taiga6.permissions import choices

ADMINS_PERMISSIONS_LIST = [x for x, _ in choices.ADMINS_PERMISSIONS]
WORKSPACE_ADMINS_PERMISSIONS_LIST = [x for x, _ in choices.WORKSPACE_ADMINS_PERMISSIONS]
MEMBERS_PERMISSIONS_LIST = [x for x, _ in choices.MEMBERS_PERMISSIONS]
WORKSPACE_MEMBERS_PERMISSIONS_LIST = [x for x, _ in choices.WORKSPACE_MEMBERS_PERMISSIONS]
ANON_PERMISSIONS_LIST = [x for x, _ in choices.ANON_PERMISSIONS]
