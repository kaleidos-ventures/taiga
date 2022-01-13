# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any, Optional, Union

from taiga.permissions import choices
from taiga.projects.models import Project
from taiga.roles import services as roles_services
from taiga.roles.models import Membership, WorkspaceMembership
from taiga.users.models import User
from taiga.workspaces.models import Workspace

AuthorizableObj = Union[Project, Workspace]


def is_project_admin(user: User, obj: Optional[AuthorizableObj]) -> bool:
    if user.is_superuser:
        return True

    project = _get_object_project(obj)
    if project is None:
        return False

    membership = roles_services.get_user_project_membership(user, project)
    if membership and membership.role.is_admin:
        return True

    return False


def is_workspace_admin(user: User, obj: Optional[AuthorizableObj]) -> bool:
    if user.is_superuser:
        return True

    workspace = _get_object_workspace(obj)
    if workspace is None:
        return False

    workspace_membership = roles_services.get_user_workspace_membership(user, workspace)
    if workspace_membership and workspace_membership.workspace_role.is_admin:
        return True

    return False


def user_has_perm(user: User, perm: str, obj: Optional[AuthorizableObj] = None, cache: str = "user") -> bool:
    """
    cache param determines how memberships are calculated
    trying to reuse the existing data in cache
    """

    project = _get_object_project(obj)
    workspace = _get_object_workspace(obj)

    if not project and not workspace:
        return False

    user_permissions = _get_user_permissions(user, project, workspace, cache=cache)
    return perm in user_permissions


def _get_object_workspace(obj: Any) -> Optional[Workspace]:
    workspace = None
    if isinstance(obj, Workspace):
        workspace = obj
    elif obj and hasattr(obj, "workspace"):
        workspace = obj.workspace

    return workspace


def _get_object_project(obj: Any) -> Optional[AuthorizableObj]:
    project = None
    if isinstance(obj, Project):
        project = obj
    elif obj and hasattr(obj, "project"):
        project = obj.project

    return project


def _get_user_permissions(user: User, project: Project, workspace: Workspace, cache: str = "user") -> list[str]:
    """
    cache param determines how memberships are calculated
    trying to reuse the existing data in cache
    """

    is_authenticated = user.is_authenticated
    project_membership: Membership = (
        roles_services.get_user_project_membership(user, project, cache=cache) if project else []
    )
    is_project_member = project_membership is not None
    is_project_admin = project is not None and is_project_member and project_membership.role.is_admin
    project_role_permissions = _get_project_membership_permissions(project_membership)

    workspace_membership: WorkspaceMembership = (
        roles_services.get_user_workspace_membership(user, workspace, cache=cache) if workspace else []
    )
    is_workspace_member = workspace_membership is not None
    is_workspace_admin = workspace is not None and is_workspace_member and workspace_membership.workspace_role.is_admin
    workspace_role_permissions = _get_workspace_membership_permissions(workspace_membership)

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


def _get_project_membership_permissions(membership: Membership) -> list[str]:
    if membership and membership.role and membership.role.permissions:
        return membership.role.permissions
    return []


def _get_workspace_membership_permissions(workspace_membership: WorkspaceMembership) -> list[str]:
    if workspace_membership and workspace_membership.workspace_role and workspace_membership.workspace_role.permissions:
        return workspace_membership.workspace_role.permissions
    return []


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
