# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Iterable, Optional

from taiga.projects import repositories as projects_repo
from taiga.projects.models import Project
from taiga.users.models import User
from taiga.workspaces.models import Workspace


def get_projects(workspace_slug: str) -> Iterable[Project]:
    return projects_repo.get_projects(workspace_slug=workspace_slug)


def create_project(
    workspace: Workspace, name: str, description: Optional[str], color: Optional[int], owner: User
) -> Project:
    return projects_repo.create_project(
        workspace=workspace, name=name, description=description, color=color, owner=owner
    )


def get_project(slug: str) -> Optional[Project]:
    return projects_repo.get_project(slug=slug)
