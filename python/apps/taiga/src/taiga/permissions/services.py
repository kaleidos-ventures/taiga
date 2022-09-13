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
from taiga.users.models import AnyUser
from taiga.workspaces.roles import repositories as ws_roles_repositories
from taiga.workspaces.workspaces.models import Workspace

AuthorizableObj = Project | Workspace


async def is_project_admin(user: AnyUser, obj: Any) -> bool:
    project = await _get_object_project(obj)
    if project is None:
        return False

    if user.is_superuser:
        return True

    role = await roles_repositories.get_role_for_user(user_id=user.id, project_id=project.id)
    return role.is_admin if role else False


async def is_workspace_admin(user: AnyUser, obj: Any) -> bool:
    workspace = await _get_object_workspace(obj)
    if workspace is None:
        return False

    if user.is_superuser:
        return True

    role = await ws_roles_repositories.get_workspace_role_for_user(user_id=user.id, workspace_id=workspace.id)
    return role.is_admin if role else False


async def user_has_perm(user: AnyUser, perm: str | None, obj: Any) -> bool:
    return perm in await get_user_permissions(user=user, obj=obj)


async def user_can_view_project(user: AnyUser, obj: Any) -> bool:
    # TODO: this method it's NOT considering users with a pending invitation (this scenario should be included here)
    return len(await get_user_permissions(user=user, obj=obj)) > 0


async def get_user_permissions(user: AnyUser, obj: Any) -> list[str]:
    project = await _get_object_project(obj)
    workspace = await _get_object_workspace(obj)

    if not project and not workspace:
        return []

    is_workspace_admin, is_workspace_member, workspace_role_permissions = await get_user_workspace_role_info(
        user=user, workspace=workspace
    )
    if project:
        is_project_admin, is_project_member, project_role_permissions = await get_user_project_role_info(
            user=user, project=project
        )
        user_permissions = await get_user_permissions_for_project(
            is_project_admin=is_project_admin,
            is_workspace_admin=is_workspace_admin,
            is_project_member=is_project_member,
            is_workspace_member=is_workspace_member,
            is_authenticated=user.is_authenticated,
            project_role_permissions=project_role_permissions,
            project=project,
        )
    elif workspace:
        user_permissions = await get_user_permissions_for_workspace(
            workspace_role_permissions=workspace_role_permissions
        )

    return user_permissions


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


async def get_user_project_role_info(user: AnyUser, project: Project) -> tuple[bool, bool, list[str]]:
    role = await roles_repositories.get_role_for_user(user_id=user.id, project_id=project.id)
    if role:
        return role.is_admin, True, role.permissions

    return False, False, []


async def get_user_workspace_role_info(user: AnyUser, workspace: Workspace) -> tuple[bool, bool, list[str]]:
    role = await ws_roles_repositories.get_workspace_role_for_user(user_id=user.id, workspace_id=workspace.id)
    if role:
        return role.is_admin, True, role.permissions

    return False, False, []


async def get_user_permissions_for_project(
    is_project_admin: bool,
    is_workspace_admin: bool,
    is_project_member: bool,
    is_workspace_member: bool,
    is_authenticated: bool,
    project_role_permissions: list[str],
    project: Project,
) -> list[str]:
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
    if is_project_admin:
        return choices.ProjectPermissions.values
    elif is_workspace_admin:
        return choices.ProjectPermissions.values
    elif is_project_member:
        return project_role_permissions
    elif is_workspace_member:
        return project.workspace_member_permissions or []
    elif is_authenticated:
        return project.public_permissions or []

    return project.anon_permissions or []


async def get_user_permissions_for_workspace(workspace_role_permissions: list[str]) -> list[str]:
    # TODO review when we do workspaces permissions
    return workspace_role_permissions


def permissions_are_valid(permissions: list[str]) -> bool:
    return set.issubset(set(permissions), set(choices.ProjectPermissions))


def permissions_are_compatible(permissions: list[str]) -> bool:
    # a user cannot see tasks if she has no access to stories
    if "view_story" not in permissions and set.intersection(set(permissions), set(["view_task"])):
        return False

    # a user cannot edit a story if she has no view permission
    if "view_story" not in permissions and set.intersection(set(permissions), choices.EditStoryPermissions):
        return False

    # a user cannot edit a task if she has no view permission
    if "view_task" not in permissions and set.intersection(set(permissions), choices.EditTaskPermissions):
        return False

    return True
