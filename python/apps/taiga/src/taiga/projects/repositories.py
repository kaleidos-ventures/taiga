# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
from collections.abc import Iterable
from typing import Optional

from django.core.files import File
from django.db.models import Q
from taiga.projects.models import Project, ProjectTemplate
from taiga.users.models import User
from taiga.workspaces.models import Workspace


def get_projects(workspace_slug: str) -> Iterable[Project]:
    data: Iterable[Project] = Project.objects.filter(workspace__slug=workspace_slug).order_by("-created_date")
    return data


def get_workspace_projects_for_user(workspace_id: int, user_id: int) -> Iterable[Project]:
    # projects of a workspace where:
    # - the user is member
    # - the workspace_member_permissions allow to ws members
    return Project.objects.filter(
        Q(workspace_id=workspace_id), Q(members__id=user_id) | Q(workspace_member_permissions__len__gt=0)
    ).distinct()


def create_project(
    workspace: Workspace,
    name: str,
    description: Optional[str],
    color: Optional[int],
    owner: User,
    logo: Optional[File] = File(None),
) -> Project:

    return Project.objects.create(
        name=name,
        description=description,
        workspace=workspace,
        color=color,
        owner=owner,
        logo=logo,
    )


def get_project(slug: str) -> Optional[Project]:
    try:
        return Project.objects.get(slug=slug)
    except Project.DoesNotExist:
        return None


def get_project_owner(project: Project) -> User:
    return project.owner


def get_template(slug: str) -> ProjectTemplate:
    return ProjectTemplate.objects.get(slug=slug)


def update_project_public_permissions(
    project: Project, permissions: list[str], anon_permissions: list[str]
) -> list[str]:
    project.public_permissions = permissions
    project.anon_permissions = anon_permissions
    project.save()
    return project.public_permissions
