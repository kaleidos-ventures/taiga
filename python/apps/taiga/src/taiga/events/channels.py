# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.projects.projects.models import Project
from taiga.users.models import AnyUser, User
from taiga.workspaces.workspaces.models import Workspace

_SYSTEM_CHANNEL_PATTERN = "system"
_USER_CHANNEL_PATTERN = "users.{username}"
_PROJECT_CHANNEL_PATTERN = "projects.{id}"
_WORKSPACE_CHANNEL_PATTERN = "workspaces.{id}"


def system_channel() -> str:
    return _SYSTEM_CHANNEL_PATTERN


def user_channel(user: AnyUser | str) -> str:
    username = user.username if isinstance(user, User) else user
    return _USER_CHANNEL_PATTERN.format(username=username)


def project_channel(project: Project | str) -> str:
    id = project.b64id if isinstance(project, Project) else project
    return _PROJECT_CHANNEL_PATTERN.format(id=id)


def workspace_channel(workspace: Workspace | str) -> str:
    id = workspace.b64id if isinstance(workspace, Workspace) else workspace
    return _WORKSPACE_CHANNEL_PATTERN.format(id=id)
