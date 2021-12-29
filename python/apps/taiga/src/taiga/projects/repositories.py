# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
from typing import Iterable, List, Optional

from django.core.files import File
from taiga.projects.models import Membership, Project, ProjectTemplate
from taiga.users.models import Role, User
from taiga.workspaces.models import Workspace


def get_projects(workspace_slug: str) -> Iterable[Project]:
    data: Iterable[Project] = Project.objects.filter(workspace__slug=workspace_slug).order_by("-created_date")
    return data


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


def get_template(slug: str) -> ProjectTemplate:
    return ProjectTemplate.objects.get(slug=slug)


def create_membership(user: User, project: Project, role: Role, email: str) -> Membership:
    return Membership.objects.create(user=user, project=project, role=role, email=email)


def get_project_role(project: Project, slug: str) -> Role:
    try:
        return project.roles.get(slug=slug)
    except Role.DoesNotExist:
        return None


def get_project_roles(project: Project) -> List[Role]:
    return project.roles.all()


def get_first_role(project: Project) -> Role:
    return project.roles.first()


def get_num_members_by_role_id(role_id: int) -> int:
    if role_id:
        return Membership.objects.filter(role_id=role_id).count()

    return 0


def update_role_permissions(role: Role, permissions: List[str]) -> Role:
    role.permissions = permissions
    role.save()
    return role
