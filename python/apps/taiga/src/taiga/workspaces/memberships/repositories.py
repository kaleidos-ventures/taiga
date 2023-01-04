# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Literal, TypedDict
from uuid import UUID

from asgiref.sync import sync_to_async
from taiga.base.db.models import QuerySet
from taiga.users.models import User
from taiga.workspaces.memberships.models import WorkspaceMembership
from taiga.workspaces.roles.models import WorkspaceRole
from taiga.workspaces.workspaces.models import Workspace

##########################################################
# filters and querysets
##########################################################


DEFAULT_QUERYSET = WorkspaceMembership.objects.all()


class WorkspaceMembershipFilters(TypedDict, total=False):
    workspace_id: UUID
    user_id: UUID


def _apply_filters_to_queryset(
    qs: QuerySet[WorkspaceMembership],
    filters: WorkspaceMembershipFilters = {},
) -> QuerySet[WorkspaceMembership]:
    return qs.filter(**filters)


WorkspaceMembershipSelectRelated = list[
    Literal[
        "role",
        "user",
        "workspace",
    ]
]


def _apply_select_related_to_queryset(
    qs: QuerySet[WorkspaceMembership],
    select_related: WorkspaceMembershipSelectRelated,
) -> QuerySet[WorkspaceMembership]:
    return qs.select_related(*select_related)


##########################################################
# create workspace membership
##########################################################


@sync_to_async
def create_workspace_membership(user: User, workspace: Workspace, role: WorkspaceRole) -> WorkspaceMembership:
    return WorkspaceMembership.objects.create(user=user, workspace=workspace, role=role)


##########################################################
# get workspace membership
##########################################################


@sync_to_async
def get_workspace_membership(
    filters: WorkspaceMembershipFilters = {},
    select_related: WorkspaceMembershipSelectRelated = ["role"],
) -> WorkspaceMembership | None:
    qs = _apply_filters_to_queryset(filters=filters, qs=DEFAULT_QUERYSET)
    qs = _apply_select_related_to_queryset(qs=qs, select_related=select_related)
    try:
        return qs.get()
    except WorkspaceMembership.DoesNotExist:
        return None
