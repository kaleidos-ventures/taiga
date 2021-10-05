# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Iterable, Optional

from taiga.models.workspaces import Workspace
from taiga.repositories import workspaces as workspaces_repo


def get_workspaces(owner_id: int) -> Iterable[Workspace]:
    return workspaces_repo.get_workspaces(owner_id)


def create_workspace(name: str, color: int) -> Optional[Workspace]:
    return workspaces_repo.create_workspace(name.strip(), color)


def get_workspace(id: int) -> Optional[Workspace]:
    return workspaces_repo.get_workspace(id)
