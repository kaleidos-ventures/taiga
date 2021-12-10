# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any, List, Optional, Union

from taiga.projects.models import Membership, Project
from taiga.users.models import User
from taiga.workspaces.models import Workspace, WorkspaceMembership

AuthorizableObj = Union[Project, Workspace]


def is_project_admin(user: User, obj: Optional[AuthorizableObj]) -> bool:
    if user.is_superuser:
        return True

    project = _get_object_project(obj)
    if project is None:
        return False

    membership = _get_user_project_membership(user, project)
    if membership and membership.role.is_admin:
        return True

    return False


def is_workspace_admin(user: User, obj: Optional[AuthorizableObj]) -> bool:
    if user.is_superuser:
        return True

    workspace = _get_object_workspace(obj)
    if workspace is None:
        return False

    workspace_membership = _get_user_workspace_membership(user, workspace)
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


def _get_user_project_membership(user: User, project: Project, cache: str = "user") -> Membership:
    """
    cache param determines how memberships are calculated
    trying to reuse the existing data in cache
    """
    if user.is_anonymous:
        return None

    if cache == "user":
        return user.cached_membership_for_project(project)

    return project.cached_memberships_for_user(user)


def _get_user_workspace_membership(user: User, workspace: Workspace, cache: str = "user") -> WorkspaceMembership:
    """
    cache param determines how memberships are calculated
    trying to reuse the existing data in cache
    """
    if user.is_anonymous:
        return None

    if cache == "user":
        return user.cached_memberships_for_workspace(workspace)

    return workspace.cached_workspace_memberships_for_user(user)


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


def _get_user_permissions(user: User, project: Project, workspace: Workspace, cache: str = "user") -> List[str]:
    """
    cache param determines how memberships are calculated
    trying to reuse the existing data in cache
    """

    is_authenticated = user.is_authenticated
    project_membership: Membership = _get_user_project_membership(user, project, cache=cache) if project else []
    is_project_member = project_membership is not None
    is_project_admin = project is not None and is_project_member and project_membership.role.is_admin
    project_role_permissions = _get_project_membership_permissions(project_membership)

    workspace_membership: WorkspaceMembership = (
        _get_user_workspace_membership(user, workspace, cache=cache) if workspace else []
    )
    workspace_role_permissions = _get_workspace_membership_permissions(workspace_membership)
    is_workspace_member = workspace_membership is not None
    is_workspace_admin = (
        workspace is not None and workspace_membership is not None and workspace_membership.workspace_role.is_admin
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

    return user_permissions


def _get_project_membership_permissions(membership: Membership) -> List[str]:
    if membership and membership.role and membership.role.permissions:
        return membership.role.permissions
    return []


def _get_workspace_membership_permissions(workspace_membership: WorkspaceMembership) -> List[str]:
    if workspace_membership and workspace_membership.workspace_role and workspace_membership.workspace_role.permissions:
        return workspace_membership.workspace_role.permissions
    return []
