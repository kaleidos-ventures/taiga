# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
from typing import Iterable, Optional

from django.core.files import File
from taiga.projects.models import Project
from taiga.users.models import User
from taiga.workspaces.models import Workspace


def get_projects(workspace_slug: str) -> Iterable[Project]:
    data: Iterable[Project] = Project.objects.filter(workspace__slug=workspace_slug).order_by("-created_date")
    return data


def create_project(
    workspace: Workspace,
    name: str,
    description: Optional[str],
    color: Optional[int],
    owner: User,
    logo: Optional[File] = File(None),
) -> Project:

    return Project.objects.create(
        name=name,
        description=description,
        workspace=workspace,
        color=color,
        owner=owner,
        logo=logo,
    )


def get_project(slug: str) -> Optional[Project]:
    try:
        return Project.objects.get(slug=slug)
    except Project.DoesNotExist:
        return None
