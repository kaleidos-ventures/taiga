# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.projects.models import Project
from taiga.roles import services as roles_services
from taiga.roles.models import Membership, WorkspaceMembership
from taiga.users.models import User
from taiga.workspaces.models import Workspace


def is_project_admin(user: User, project: Project) -> bool:
    membership = roles_services.get_user_project_membership(user=user, project=project)
    if membership and membership.role.is_admin:
        return True

    return False


def is_workspace_admin(user: User, workspace: Workspace) -> bool:
    workspace_membership = roles_services.get_user_workspace_membership(user=user, workspace=workspace)
    if workspace_membership and workspace_membership.workspace_role.is_admin:
        return True

    return False


def is_project_membership_admin(project_membership: Membership) -> bool:
    return project_membership.role.is_admin


def is_workspace_membership_admin(workspace_membership: WorkspaceMembership) -> bool:
    return workspace_membership.workspace_role.is_admin


def get_project_membership_permissions(membership: Membership) -> list[str]:
    if membership and membership.role and membership.role.permissions:
        return membership.role.permissions
    return []


def get_workspace_membership_permissions(workspace_membership: WorkspaceMembership) -> list[str]:
    if workspace_membership and workspace_membership.workspace_role and workspace_membership.workspace_role.permissions:
        return workspace_membership.workspace_role.permissions
    return []
