# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any

from taiga.projects.models import Project
from taiga.users.models import User
from taiga.workspaces.models import Workspace


def is_project_admin(user: User, project: Project) -> bool:
    return True


def is_workspace_admin(user: User, workspace: Workspace) -> bool:
    return True


def user_has_perm(user: User, perm: str, obj: Any, cache: str = "user") -> bool:
    return True
