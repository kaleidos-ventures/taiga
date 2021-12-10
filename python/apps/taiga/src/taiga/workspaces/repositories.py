# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Iterable, List, Optional

from django.db.models import Count, OuterRef, Prefetch, Subquery
from taiga.projects.models import Project
from taiga.users.models import User, WorkspaceRole
from taiga.workspaces.models import Workspace, WorkspaceMembership


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


def create_workspace_role(
    name: str, slug: str, permissions: List[str], workspace: Workspace, _is_admin: bool = False
) -> Workspace:
    return WorkspaceRole.objects.create(
        name="Administrators",
        slug="admin",
        permissions=permissions,
        workspace=workspace,
        _is_admin=True,
    )


def create_workspace_membership(user: User, workspace: Workspace, workspace_role: WorkspaceRole) -> WorkspaceMembership:
    return WorkspaceMembership.objects.create(user=user, workspace=workspace, workspace_role=workspace_role)
