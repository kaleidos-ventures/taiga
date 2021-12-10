# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Iterable, Optional

from taiga.permissions import choices
from taiga.users.models import User
from taiga.workspaces import repositories as workspaces_repo
from taiga.workspaces.models import Workspace


def get_workspaces(owner: User) -> Iterable[Workspace]:
    return workspaces_repo.get_workspaces_with_latest_projects(owner=owner)


def create_workspace(name: str, color: int, owner: User) -> Workspace:
    workspace = workspaces_repo.create_workspace(name=name, color=color, owner=owner)
    workspace_role = workspaces_repo.create_workspace_role(
        name="Administrators",
        slug="admin",
        permissions=choices.WORKSPACE_ADMINS_PERMISSIONS_LIST,
        workspace=workspace,
        _is_admin=True,
    )
    workspaces_repo.create_workspace_membership(user=owner, workspace=workspace, workspace_role=workspace_role)
    return workspace


def get_workspace(slug: str) -> Optional[Workspace]:
    return workspaces_repo.get_workspace(slug=slug)
