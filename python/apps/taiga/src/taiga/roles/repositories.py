# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Final
from uuid import UUID

from asgiref.sync import sync_to_async
from taiga.base.db.models import Count
from taiga.projects.models import Project
from taiga.roles.models import ProjectMembership, ProjectRole, WorkspaceMembership, WorkspaceRole
from taiga.users.models import User
from taiga.workspaces.models import Workspace

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
def update_project_membership_role(membership: ProjectMembership, role: ProjectRole) -> ProjectMembership:
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


####################################
# Workspace
####################################

# WorkscpaceMembership


@sync_to_async
def create_workspace_membership(user: User, workspace: Workspace, role: WorkspaceRole) -> WorkspaceMembership:
    return WorkspaceMembership.objects.create(user=user, workspace=workspace, role=role)


# Roles

WS_ROLE_NAME_ADMIN: Final = "admin"
WS_ROLE_NAME_MEMBER: Final = "member"
WS_ROLE_NAME_GUEST: Final = "guest"
WS_ROLE_NAME_NONE: Final = "none"


def get_user_workspace_role_name_sync(workspace_id: UUID, user_id: UUID) -> str:
    try:
        membership = WorkspaceMembership.objects.select_related("role").get(workspace_id=workspace_id, user_id=user_id)

        if membership.role.is_admin:
            return WS_ROLE_NAME_ADMIN
        else:
            return WS_ROLE_NAME_MEMBER
    except WorkspaceMembership.DoesNotExist:
        if ProjectMembership.objects.filter(user_id=user_id, project__workspace_id=workspace_id).exists():
            return WS_ROLE_NAME_GUEST
        else:
            return WS_ROLE_NAME_NONE


get_user_workspace_role_name = sync_to_async(get_user_workspace_role_name_sync)


@sync_to_async
def get_workspace_role_for_user(user_id: UUID, workspace_id: UUID) -> WorkspaceRole | None:
    try:
        return WorkspaceRole.objects.get(memberships__user__id=user_id, memberships__workspace__id=workspace_id)
    except WorkspaceRole.DoesNotExist:
        return None


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
