# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Final

from asgiref.sync import sync_to_async
from django.db.models import Count
from taiga.projects.models import Project
from taiga.roles.models import Membership, Role, WorkspaceMembership, WorkspaceRole
from taiga.users.models import User
from taiga.workspaces.models import Workspace

####################################
# Project
####################################

# Memberships


@sync_to_async
def get_user_project_membership(user: User, project: Project, cache: str = "user") -> Membership | None:
    """
    cache param determines how memberships are calculated
    trying to reuse the existing data in cache
    """
    if user.is_anonymous:
        return None

    if cache == "user":
        return user.cached_membership_for_project(project)

    return project.cached_memberships_for_user(user)


@sync_to_async
def create_membership(user: User, project: Project, role: Role, email: str | None = None) -> Membership:
    return Membership.objects.create(user=user, project=project, role=role, email=email)


@sync_to_async
def is_project_membership_admin(project_membership: Membership) -> bool:
    return project_membership.role.is_admin


@sync_to_async
def get_project_membership_permissions(membership: Membership) -> list[str]:
    return membership.role.permissions


# Roles


@sync_to_async
def get_project_roles(project: Project) -> list[Role]:
    return list(project.roles.annotate(num_members=Count("memberships")).all())


@sync_to_async
def get_project_role(project: Project, slug: str) -> Role | None:
    try:
        return project.roles.annotate(num_members=Count("memberships")).get(slug=slug)
    except Role.DoesNotExist:
        return None


@sync_to_async
def get_first_role(project: Project) -> Role | None:
    return project.roles.first()


@sync_to_async
def get_num_members_by_role_id(role_id: int) -> int:
    return Membership.objects.filter(role_id=role_id).count()


@sync_to_async
def get_project_role_from_membership(project_membership: Membership) -> Role:
    return project_membership.role


@sync_to_async
def get_workspace_role_from_membership(workspace_membership: WorkspaceMembership) -> WorkspaceRole:
    return workspace_membership.workspace_role


@sync_to_async
def is_project_admin(user_id: int, project_id: int) -> bool:
    return Membership.objects.filter(user_id=user_id, project_id=project_id, role__is_admin=True).exists()


@sync_to_async
def update_role_permissions(role: Role, permissions: list[str]) -> Role:
    role.permissions = permissions
    role.save()
    return role


####################################
# Workspace
####################################

# Membership


@sync_to_async
def get_user_workspace_membership(user: User, workspace: Workspace, cache: str = "user") -> WorkspaceMembership | None:
    """
    cache param determines how memberships are calculated
    trying to reuse the existing data in cache
    """
    if user.is_anonymous:
        return None

    if cache == "user":
        return user.cached_memberships_for_workspace(workspace)

    return workspace.cached_workspace_memberships_for_user(user)


@sync_to_async
def create_workspace_membership(user: User, workspace: Workspace, workspace_role: WorkspaceRole) -> WorkspaceMembership:
    return WorkspaceMembership.objects.create(user=user, workspace=workspace, workspace_role=workspace_role)


@sync_to_async
def is_workspace_membership_admin(workspace_membership: WorkspaceMembership) -> bool:
    return workspace_membership.workspace_role.is_admin


@sync_to_async
def get_workspace_membership_permissions(workspace_membership: WorkspaceMembership) -> list[str]:
    return workspace_membership.workspace_role.permissions


# Roles


@sync_to_async
def is_workspace_admin(user_id: int, workspace_id: int) -> bool:
    return WorkspaceMembership.objects.filter(
        user_id=user_id, workspace_id=workspace_id, workspace_role__is_admin=True
    ).exists()


WS_ROLE_NAME_ADMIN: Final = "admin"
WS_ROLE_NAME_MEMBER: Final = "member"
WS_ROLE_NAME_GUEST: Final = "guest"
WS_ROLE_NAME_NONE: Final = "none"


def get_user_workspace_role_name_sync(workspace_id: int, user_id: int) -> str:
    try:
        membership = WorkspaceMembership.objects.select_related("workspace_role").get(
            workspace_id=workspace_id, user_id=user_id
        )

        if membership.workspace_role.is_admin:
            return WS_ROLE_NAME_ADMIN
        else:
            return WS_ROLE_NAME_MEMBER
    except WorkspaceMembership.DoesNotExist:
        if Membership.objects.filter(user_id=user_id, project__workspace_id=workspace_id).exists():
            return WS_ROLE_NAME_GUEST
        else:
            return WS_ROLE_NAME_NONE


get_user_workspace_role_name = sync_to_async(get_user_workspace_role_name_sync)


@sync_to_async
def create_workspace_role(
    name: str, slug: str, workspace: Workspace, permissions: list[str] = [], is_admin: bool = False
) -> Workspace:
    return WorkspaceRole.objects.create(
        workspace=workspace,
        name=name,
        slug=slug,
        permissions=permissions,
        is_admin=is_admin,
    )
