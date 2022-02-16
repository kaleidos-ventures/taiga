# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any

from asgiref.sync import sync_to_async
from taiga.permissions import choices
from taiga.projects.models import Project
from taiga.roles import repositories as roles_repositories
from taiga.roles import services as roles_services
from taiga.users.models import User
from taiga.workspaces.models import Workspace

AuthorizableObj = Project | Workspace


async def is_project_admin(user: User, obj: Any) -> bool:
    project = await _get_object_project(obj)
    if project is None:
        return False

    if user.is_superuser:
        return True

    return await roles_repositories.is_project_admin(user_id=user.id, project_id=project.id)


async def is_workspace_admin(user: User, obj: Any) -> bool:
    workspace = await _get_object_workspace(obj)
    if workspace is None:
        return False

    if user.is_superuser:
        return True

    return await roles_repositories.is_workspace_admin(user_id=user.id, workspace_id=workspace.id)


async def user_has_perm(user: User, perm: str, obj: Any, cache: str = "user") -> bool:
    """
    cache param determines how memberships are calculated
    trying to reuse the existing data in cache
    """

    project = await _get_object_project(obj)
    workspace = await _get_object_workspace(obj)

    if not project and not workspace:
        return False

    user_permissions = await _get_user_permissions(user=user, workspace=workspace, project=project, cache=cache)
    return perm in user_permissions


async def user_can_view_project(user: User, project: Project, cache: str = "user") -> bool:
    project = await _get_object_project(project)
    if not project:
        return False

    workspace = project.workspace

    user_permissions = await _get_user_permissions(user=user, workspace=workspace, project=project, cache=cache)
    return len(user_permissions) > 0


@sync_to_async
def _get_object_workspace(obj: Any) -> Workspace | None:
    if isinstance(obj, Workspace):
        return obj
    elif obj and hasattr(obj, "workspace"):
        return obj.workspace

    return None


@sync_to_async
def _get_object_project(obj: Any) -> Project | None:
    if isinstance(obj, Project):
        return obj
    elif obj and hasattr(obj, "project"):
        return obj.project

    return None


# TODO: missing tests
async def _get_user_permissions(
    user: User, workspace: Workspace, project: Project | None = None, cache: str = "user"
) -> list[str]:
    """
    cache param determines how memberships are calculated
    trying to reuse the existing data in cache
    """

    is_authenticated = user.is_authenticated

    if project:
        project_membership = await roles_services.get_user_project_membership(user, project, cache=cache)
        is_project_member = project_membership is not None
        role = (
            await roles_repositories.get_project_role_from_membership(project_membership) if is_project_member else None
        )
        is_project_admin = role.is_admin if role else False
        project_role_permissions = role.permissions if role else []

    workspace_membership = await roles_services.get_user_workspace_membership(user, workspace, cache=cache)
    is_workspace_member = workspace_membership is not None
    workspace_role = (
        await roles_repositories.get_workspace_role_from_membership(workspace_membership)
        if is_workspace_member
        else None
    )
    is_workspace_admin = workspace_role.is_admin if workspace_role else False
    workspace_role_permissions = workspace_role.permissions if workspace_role else []

    # pj (user is)		ws (user is)	Applied permission role (referred to a project)
    # =================================================================================
    # pj-admin			ws-admin		role-pj-admin.permissions
    # pj-admin			ws-member		role-pj-admin.permissions
    # pj-admin			no-role			role-pj-admin.permissions
    # pj-member			ws-admin		role-ws-admin [edit permissions over pj]
    # no-role			ws-admin		role-ws-admin [edit permissions over pj]
    # pj-member			ws-member		role-pj-member.permissions
    # pj-member			no-role			role-pj-member.permissions
    # no-role			ws-member		pj.workspace-member-permissions
    # no-role			no-role			pj.public-permissions
    # no-logged			no-logged		pj.public-permissions [only view]

    if project:
        if is_project_admin:
            user_permissions = project_role_permissions
        elif is_workspace_admin:
            user_permissions = choices.PROJECT_PERMISSIONS
        elif is_project_member:
            user_permissions = project_role_permissions
        elif is_workspace_member:
            user_permissions = workspace_role_permissions
        elif is_authenticated:
            user_permissions = project.public_permissions
        else:
            user_permissions = project.anon_permissions
    elif workspace:
        # TODO revisar esta parte cuando tengamos permisos de WS
        user_permissions = workspace_role_permissions

    return user_permissions


def permissions_are_valid(permissions: list[str]) -> bool:
    return set.issubset(set(permissions), choices.VALID_PROJECT_CHOICES)


def permissions_are_compatible(permissions: list[str]) -> bool:
    # a user cannot see tasks if she has no access to user stories
    incompatible_permissions = set(["view_tasks"])
    if "view_us" not in permissions and set.intersection(set(permissions), incompatible_permissions):
        return False

    # a user cannot edit a user story if she has no view permission
    if "view_us" not in permissions and set.intersection(set(permissions), choices.EDIT_US_PERMISSIONS):
        return False

    # a user cannot edit a task if she has no view permission
    if "view_tasks" not in permissions and set.intersection(set(permissions), choices.EDIT_TASK_PERMISSIONS):
        return False

    return True
