# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Iterable, Optional

from taiga.models.projects import Project
from taiga.models.users import User
from taiga.models.workspaces import Workspace


def get_projects(workspace_slug: str) -> Iterable[Project]:
    data: Iterable[Project] = Project.objects.filter(workspace__slug=workspace_slug).order_by("-created_date")
    return data


def create_project(
    workspace_slug: str, name: str, description: Optional[str], color: Optional[int], owner: User
) -> Project:
    workspace: Workspace = Workspace.objects.get(slug=workspace_slug)
    return Project.objects.create(
        name=name, description=description, workspace_id=workspace.id, color=color, owner=owner
    )


def get_project(slug: str) -> Optional[Project]:
    try:
        return Project.objects.get(slug=slug)
    except Project.DoesNotExist:
        return None
