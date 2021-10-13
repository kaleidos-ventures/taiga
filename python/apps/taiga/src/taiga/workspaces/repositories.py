# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Iterable, Optional

from taiga.users.models import User
from taiga.workspaces.models import Workspace


def get_workspaces_with_latest_projects(owner: User) -> Iterable[Workspace]:
    data: Iterable[Workspace] = Workspace.objects.filter(owner=owner).order_by("-created_date")
    # TODO: add annotation for latest_projects and total_projects
    return data


def create_workspace(name: str, color: int, owner: User) -> Workspace:
    return Workspace.objects.create(name=name, color=color, owner=owner)


def get_workspace(slug: str) -> Optional[Workspace]:
    try:
        return Workspace.objects.get(slug=slug)
    except Workspace.DoesNotExist:
        return None
