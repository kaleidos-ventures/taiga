# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Literal, TypedDict
from uuid import UUID

from asgiref.sync import sync_to_async
from taiga.base.db.models import Q, QuerySet
from taiga.users.models import User
from taiga.workspaces.invitations.choices import WorkspaceInvitationStatus
from taiga.workspaces.invitations.models import WorkspaceInvitation

##########################################################
# filters and querysets
##########################################################


DEFAULT_QUERYSET = WorkspaceInvitation.objects.all()


class WorkspaceInvitationFilters(TypedDict, total=False):
    username_or_email: str
    workspace_id: UUID
    statuses: list[WorkspaceInvitationStatus]
    status: WorkspaceInvitationStatus


def _apply_filters_to_queryset(
    qs: QuerySet[WorkspaceInvitation],
    filters: WorkspaceInvitationFilters = {},
) -> QuerySet[WorkspaceInvitation]:
    filter_data = dict(filters.copy())

    if "username_or_email" in filter_data:
        username_or_email = filter_data.pop("username_or_email")
        by_user = Q(user__username__iexact=username_or_email) | Q(user__email__iexact=username_or_email)
        by_email = Q(user__isnull=True, email__iexact=username_or_email)
        qs = qs.filter(by_user | by_email)

    if "statuses" in filter_data:
        filter_data["status__in"] = filter_data.pop("statuses")

    return qs.filter(**filter_data)


WorkspaceInvitationSelectRelated = list[
    Literal[
        "user",
        "workspace",
        "invited_by",
    ]
]


def _apply_select_related_to_queryset(
    qs: QuerySet[WorkspaceInvitation],
    select_related: WorkspaceInvitationSelectRelated,
) -> QuerySet[WorkspaceInvitation]:
    return qs.select_related(*select_related)


WorkspaceInvitationOrderBy = list[
    Literal[
        "full_name",
        "email",
    ]
]


def _apply_order_by_to_queryset(
    qs: QuerySet[WorkspaceInvitation],
    order_by: WorkspaceInvitationOrderBy,
) -> QuerySet[WorkspaceInvitation]:
    order_by_data = []

    for key in order_by:
        if key == "full_name":
            order_by_data.append("user__full_name")
        else:
            order_by_data.append(key)

    return qs.order_by(*order_by_data)


##########################################################
# create workspace invitations
##########################################################


@sync_to_async
def create_workspace_invitations(
    objs: list[WorkspaceInvitation],
    select_related: WorkspaceInvitationSelectRelated = [],
) -> list[WorkspaceInvitation]:
    qs = _apply_select_related_to_queryset(qs=DEFAULT_QUERYSET, select_related=select_related)
    return qs.bulk_create(objs=objs)


##########################################################
# list workspace invitations
##########################################################


@sync_to_async
def list_workspace_invitations(
    filters: WorkspaceInvitationFilters = {},
    offset: int | None = None,
    limit: int | None = None,
    select_related: WorkspaceInvitationSelectRelated = [],
    order_by: WorkspaceInvitationOrderBy = ["full_name", "email"],
) -> list[WorkspaceInvitation]:
    qs = _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    qs = _apply_select_related_to_queryset(qs=qs, select_related=select_related)
    qs = _apply_order_by_to_queryset(order_by=order_by, qs=qs)

    if limit is not None and offset is not None:
        limit += offset

    return list(qs[offset:limit])


##########################################################
# get workspace invitation
##########################################################


@sync_to_async
def get_workspace_invitation(
    filters: WorkspaceInvitationFilters = {},
    select_related: WorkspaceInvitationSelectRelated = [],
) -> WorkspaceInvitation | None:
    qs = _apply_filters_to_queryset(filters=filters, qs=DEFAULT_QUERYSET)
    qs = _apply_select_related_to_queryset(qs=qs, select_related=select_related)
    try:
        return qs.get()
    except WorkspaceInvitation.DoesNotExist:
        return None


##########################################################
# update workspace invitations
##########################################################


@sync_to_async
def bulk_update_workspace_invitations(objs_to_update: list[WorkspaceInvitation], fields_to_update: list[str]) -> None:
    WorkspaceInvitation.objects.bulk_update(objs_to_update, fields_to_update)


@sync_to_async
def update_user_workspaces_invitations(user: User) -> None:
    WorkspaceInvitation.objects.filter(email=user.email).update(user=user)


##########################################################
# misc
##########################################################


@sync_to_async
def get_total_workspace_invitations(
    filters: WorkspaceInvitationFilters = {},
) -> int:
    qs = _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    return qs.count()
