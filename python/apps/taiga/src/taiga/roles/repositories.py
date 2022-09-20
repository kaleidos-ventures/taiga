# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from uuid import UUID

from asgiref.sync import sync_to_async
from taiga.base.db.models import Count
from taiga.projects.models import Project
from taiga.roles.models import ProjectMembership, ProjectRole
from taiga.users.models import User

####################################
# Project
####################################

# ProjectMemberships


@sync_to_async
def create_project_membership(user: User, project: Project, role: ProjectRole) -> ProjectMembership:
    return ProjectMembership.objects.create(user=user, project=project, role=role)


@sync_to_async
def get_project_memberships(project_slug: str, offset: int = 0, limit: int = 0) -> list[ProjectMembership]:
    project_memberships_qs = (
        ProjectMembership.objects.filter(project__slug=project_slug)
        .select_related("user", "role")
        .order_by("user__full_name")
    )

    if limit:
        project_memberships_qs = project_memberships_qs[offset : offset + limit]

    return list(project_memberships_qs)


@sync_to_async
def get_project_membership(project_slug: str, username: str) -> ProjectMembership | None:
    try:
        return ProjectMembership.objects.select_related("user", "project", "role").get(
            project__slug=project_slug, user__username=username
        )
    except ProjectMembership.DoesNotExist:
        return None


@sync_to_async
def get_total_project_memberships(project_slug: str) -> int:
    return ProjectMembership.objects.filter(project__slug=project_slug).count()


@sync_to_async
def get_project_members(project: Project) -> list[User]:
    return list(project.members.all())


@sync_to_async
def user_is_project_member(project_slug: str, user_id: UUID) -> bool:
    return ProjectMembership.objects.filter(project__slug=project_slug, user__id=user_id).exists()


@sync_to_async
def update_project_membership(membership: ProjectMembership, role: ProjectRole) -> ProjectMembership:
    membership.role = role
    membership.save()

    return membership


# Roles


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
def get_num_members_by_role_id(role_id: UUID) -> int:
    return ProjectMembership.objects.filter(role_id=role_id).count()


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
