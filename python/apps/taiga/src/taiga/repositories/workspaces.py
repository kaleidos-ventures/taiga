# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Iterable, Optional

from taiga.models.workspaces import Workspace
from taiga.repositories import users as users_repo


def get_workspaces(owner_id: int) -> Iterable[Workspace]:
    data: Iterable[Workspace] = Workspace.objects.filter(owner_id=owner_id)
    return data


def create_workspace(name: str, color: int) -> Optional[Workspace]:
    #TODO: owner when we have authenticated user
    user = users_repo.get_user_by_username_or_email("admin")

    return Workspace.objects.create(
        name=name,
        color=color,
        owner=user,
    )


def get_workspace(id: int) -> Optional[Workspace]:
    try:
        return Workspace.objects.get(id=id)
    except Workspace.DoesNotExist:
        return None
