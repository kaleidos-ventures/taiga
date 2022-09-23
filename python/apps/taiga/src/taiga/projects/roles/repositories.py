# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from uuid import UUID

from asgiref.sync import sync_to_async
from taiga.base.db.models import Count
from taiga.projects.projects.models import Project
from taiga.projects.roles.models import ProjectRole


@sync_to_async
def get_project_roles(project: Project) -> list[ProjectRole]:
    return list(project.roles.annotate(num_members=Count("memberships")).all())


@sync_to_async
def get_project_roles_as_dict(project: Project) -> dict[str, ProjectRole]:
    """
    This repository returns a dict whose key is the role slug and value the Role object
    """
    return {r.slug: r for r in project.roles.all()}


@sync_to_async
def get_project_role(project: Project, slug: str) -> ProjectRole | None:
    try:
        return project.roles.annotate(num_members=Count("memberships")).get(slug=slug)
    except ProjectRole.DoesNotExist:
        return None


@sync_to_async
def get_first_role(project: Project) -> ProjectRole | None:
    return project.roles.first()


@sync_to_async
def get_role_for_user(user_id: UUID, project_id: UUID) -> ProjectRole | None:
    try:
        return ProjectRole.objects.get(memberships__user__id=user_id, memberships__project__id=project_id)
    except ProjectRole.DoesNotExist:
        return None


@sync_to_async
def update_project_role_permissions(role: ProjectRole, permissions: list[str]) -> ProjectRole:
    role.permissions = permissions
    role.save()
    return role
