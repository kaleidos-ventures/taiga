# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Iterable, Optional

from django.db.models import Count, OuterRef, Prefetch, Subquery
from taiga.projects.models import Project
from taiga.users.models import User
from taiga.workspaces.models import Workspace


def get_workspaces_with_latest_projects(owner: User) -> Iterable[Workspace]:
    last_projects_ids = Subquery(
        Project.objects.filter(workspace_id=OuterRef("workspace_id"))
        .values_list("id", flat=True)
        .order_by("-created_date")[:6]
    )
    latest_projects = Project.objects.filter(id__in=last_projects_ids).order_by("-created_date")
    return (
        Workspace.objects.filter(owner=owner)
        .prefetch_related(Prefetch("projects", queryset=latest_projects, to_attr="latest_projects"))
        .annotate(total_projects=Count("projects"))
        .order_by("-created_date")
    )


def create_workspace(name: str, color: int, owner: User) -> Workspace:
    return Workspace.objects.create(name=name, color=color, owner=owner)


def get_workspace(slug: str) -> Optional[Workspace]:
    try:
        return Workspace.objects.get(slug=slug)
    except Workspace.DoesNotExist:
        return None
