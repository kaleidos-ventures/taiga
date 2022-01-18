# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any, Optional, Union

from asgiref.sync import sync_to_async
from taiga.permissions import choices
from taiga.projects.models import Project
from taiga.roles import repositories as roles_repositories
from taiga.roles import services as roles_services
from taiga.users.models import User
from taiga.workspaces.models import Workspace

AuthorizableObj = Union[Project, Workspace]


async def is_project_admin(user: User, obj: Optional[AuthorizableObj]) -> bool:
    project = await _get_object_project(obj)
    if project is None:
        return False

    if user.is_superuser:
        return True

    return await roles_repositories.is_project_admin(user_id=user.id, project_id=project.id)


async def is_workspace_admin(user: User, obj: Optional[AuthorizableObj]) -> bool:
    workspace = await _get_object_workspace(obj)
    if workspace is None:
        return False

    if user.is_superuser:
        return True

    return await roles_repositories.is_workspace_admin(user_id=user.id, workspace_id=workspace.id)


async def user_has_perm(user: User, perm: str, obj: AuthorizableObj, cache: str = "user") -> bool:
    """
    cache param determines how memberships are calculated
    trying to reuse the existing data in cache
    """

    project = await _get_object_project(obj)
    workspace = await _get_object_workspace(obj)

    if not project and not workspace:
        return False

    user_permissions = await _get_user_permissions(user, workspace, project, cache=cache)
    return perm in user_permissions


@sync_to_async
def _get_object_workspace(obj: Any) -> Optional[Workspace]:
    workspace = None
    if isinstance(obj, Workspace):
        workspace = obj
    elif obj and hasattr(obj, "workspace"):
        workspace = obj.workspace

    return workspace


@sync_to_async
def _get_object_project(obj: Any) -> Optional[Project]:
    project = None
    if isinstance(obj, Project):
        project = obj
    elif obj and hasattr(obj, "project"):
        project = obj.project

    return project


async def _get_user_permissions(
    user: User, workspace: Workspace, project: Optional[Project] = None, cache: str = "user"
) -> list[str]:
    """
    cache param determines how memberships are calculated
    trying to reuse the existing data in cache
    """

    is_authenticated = user.is_authenticated

    if project:
        project_membership = await roles_services.get_user_project_membership(user, project, cache=cache)

        is_project_member = project_membership is not None
        is_project_admin = is_project_member and await roles_repositories.is_project_membership_admin(
            project_membership=project_membership
        )
        project_role_permissions = (
            await roles_repositories.get_project_membership_permissions(project_membership)
            if project_membership
            else []
        )

    workspace_membership = await roles_services.get_user_workspace_membership(user, workspace, cache=cache)
    is_workspace_member = workspace_membership is not None
    is_workspace_admin = is_workspace_member and await roles_repositories.is_workspace_membership_admin(
        workspace_membership=workspace_membership
    )
    workspace_role_permissions = (
        await roles_repositories.get_workspace_membership_permissions(workspace_membership)
        if workspace_membership
        else []
    )

    # pj (user is)     ws (user is)	   	Applied permission role (referred to a project)
    # =================================================================================
    # pj-admin	        ws-admin	    rol-pj-admin
    # pj-admin	        ws-member	    rol-pj-admin
    # pj-admin	        no-rol  	    rol-pj-admin
    # pj-member	        ws-admin	    rol-ws-admin
    # no-rol	        ws-admin	    rol-ws-admin
    # pj-member	        ws-member	    rol-pj-member
    # pj-member	        no-rol  	    rol-pj-member
    # no-rol	        ws-member	    rol-ws-member
    # no-rol            no-rol      	rol-public-permissions
    # no-logged         no-logged      	rol-anon-permissions

    if project:
        if is_project_admin:
            user_permissions = project_role_permissions
        elif is_workspace_admin:
            user_permissions = workspace_role_permissions
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
    # a user cannot see tasks or sprints if she has no access to user stories
    incompatible_permissions = set(["view_tasks", "view_milestones"])
    if "view_us" not in permissions and set.intersection(set(permissions), incompatible_permissions):
        return False

    # a user cannot comment a user story if she has no access to it
    if "view_us" not in permissions and "comment_us" in permissions:
        return False

    # a user cannot comment a task if she has no access to it
    if "view_tasks" not in permissions and "comment_task" in permissions:
        return False

    return True
