# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import TypedDict
from uuid import UUID

from asgiref.sync import sync_to_async
from taiga.base.db.models import QuerySet
from taiga.workspaces.roles.models import WorkspaceRole
from taiga.workspaces.workspaces.models import Workspace

##########################################################
# filters and querysets
##########################################################


DEFAULT_QUERYSET = WorkspaceRole.objects.all()


class WorkspaceRoleFilters(TypedDict, total=False):
    user_id: UUID
    workspace_id: UUID


def _apply_filters_to_queryset(
    qs: QuerySet[WorkspaceRole],
    filters: WorkspaceRoleFilters = {},
) -> QuerySet[WorkspaceRole]:
    filter_data = dict(filters.copy())

    if "user_id" in filter_data:
        filter_data["memberships__user_id"] = filter_data.pop("user_id")

    if "workspace_id" in filter_data:
        filter_data["memberships__workspace_id"] = filter_data.pop("workspace_id")

    return qs.filter(**filter_data)


##########################################################
# create workspace role
##########################################################


@sync_to_async
def create_workspace_role(
    name: str, slug: str, workspace: Workspace, permissions: list[str] = [], is_admin: bool = False
) -> WorkspaceRole:
    return WorkspaceRole.objects.create(
        workspace=workspace,
        name=name,
        slug=slug,
        permissions=permissions,
        is_admin=is_admin,
    )


##########################################################
# get workspace role
##########################################################


@sync_to_async
def get_workspace_role(
    filters: WorkspaceRoleFilters = {},
) -> WorkspaceRole | None:
    qs = _apply_filters_to_queryset(filters=filters, qs=DEFAULT_QUERYSET)
    try:
        return qs.get()
    except WorkspaceRole.DoesNotExist:
        return None
