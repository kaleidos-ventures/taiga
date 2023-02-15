# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any, Literal, TypedDict
from uuid import UUID

from asgiref.sync import sync_to_async
from taiga.base.db.models import Count, QuerySet
from taiga.projects.projects.models import Project
from taiga.projects.roles.models import ProjectRole

##########################################################
# filters and querysets
##########################################################

DEFAULT_QUERYSET = ProjectRole.objects.all()


class ProjectRoleFilters(TypedDict, total=False):
    project_id: UUID
    slug: str
    user_id: UUID


def _apply_filters_to_queryset(
    qs: QuerySet[ProjectRole],
    filters: ProjectRoleFilters = {},
) -> QuerySet[ProjectRole]:
    filter_data = dict(filters.copy())

    if "user_id" in filter_data:
        filter_data["memberships__user_id"] = filter_data.pop("user_id")

    return qs.filter(**filter_data)


ProjectRoleSelectRelated = list[
    Literal[
        "project",
    ]
]


def _apply_select_related_to_queryset(
    qs: QuerySet[ProjectRole],
    select_related: ProjectRoleSelectRelated,
) -> QuerySet[ProjectRole]:
    return qs.select_related(*select_related)


##########################################################
# create project role
##########################################################


def create_project_role_sync(
    name: str,
    slug: str,
    order: int,
    project: Project,
    permissions: list[str],
    is_admin: bool,
) -> ProjectRole:

    return ProjectRole.objects.create(
        name=name,
        slug=slug,
        order=order,
        project=project,
        permissions=permissions,
        is_admin=is_admin,
    )


create_project_role = sync_to_async(create_project_role_sync)


##########################################################
# list project roles
##########################################################


@sync_to_async
def list_project_roles(
    filters: ProjectRoleFilters = {},
    offset: int | None = None,
    limit: int | None = None,
) -> list[ProjectRole]:
    qs = _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    qs = qs.annotate(num_members=Count("memberships"))

    if limit is not None and offset is not None:
        limit += offset

    return list(qs[offset:limit])


##########################################################
# get project role
##########################################################


@sync_to_async
def get_project_role(
    filters: ProjectRoleFilters = {},
    select_related: ProjectRoleSelectRelated = ["project"],
) -> ProjectRole | None:
    qs = _apply_filters_to_queryset(qs=DEFAULT_QUERYSET, filters=filters)
    qs = _apply_select_related_to_queryset(qs=qs, select_related=select_related)
    qs = qs.annotate(num_members=Count("memberships"))

    try:
        return qs.get()
    except ProjectRole.DoesNotExist:
        return None


##########################################################
# update project role
##########################################################


@sync_to_async
def update_project_role_permissions(role: ProjectRole, values: dict[str, Any] = {}) -> ProjectRole:
    for attr, value in values.items():
        setattr(role, attr, value)

    role.save()
    return role
