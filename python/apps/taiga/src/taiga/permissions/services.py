# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any

from asgiref.sync import sync_to_async
from taiga.permissions import choices
from taiga.permissions.choices import WorkspacePermissions
from taiga.projects.invitations import repositories as pj_invitations_repositories
from taiga.projects.invitations.choices import ProjectInvitationStatus
from taiga.projects.memberships import repositories as pj_memberships_repositories
from taiga.projects.projects.models import Project
from taiga.projects.roles import repositories as pj_roles_repositories
from taiga.users.models import AnyUser, User
from taiga.workspaces.memberships import repositories as workspace_memberships_repositories
from taiga.workspaces.workspaces.models import Workspace

AuthorizableObj = Project | Workspace


async def is_project_admin(user: AnyUser, obj: Any) -> bool:
    if user.is_anonymous:
        return False

    project = await _get_object_project(obj)
    if project is None:
        return False

    if user.is_superuser:
        return True

    role = await pj_roles_repositories.get_project_role(filters={"user_id": user.id, "project_id": project.id})
    return role.is_admin if role else False


async def is_workspace_admin(user: AnyUser, obj: Any) -> bool:
    if user.is_anonymous:
        return False

    if user.is_superuser:
        return True

    workspace = await _get_object_workspace(obj)
    if workspace is None:
        return False

    ws_membership = await workspace_memberships_repositories.get_workspace_membership(
        filters={"user_id": user.id, "workspace_id": workspace.id},
    )
    return ws_membership is not None


async def is_project_member(user: AnyUser, project: Project) -> bool:
    if user.is_anonymous:
        return False

    return await pj_memberships_repositories.exist_project_membership(
        filters={"project_id": project.id, "user_id": user.id}
    )


async def user_has_perm(user: AnyUser, perm: str | None, obj: Any) -> bool:
    return perm in await get_user_permissions(user=user, obj=obj)


async def user_can_view_project(user: AnyUser, obj: Any) -> bool:
    project = await _get_object_project(obj)
    if not project:
        return False

    if await is_workspace_admin(user=user, obj=project.workspace):
        return True

    if await is_project_member(user=user, project=project):
        return True

    if await has_pending_project_invitation(user=user, project=project):
        return True

    return len(await get_user_permissions(user=user, obj=obj)) > 0


async def get_user_permissions(user: AnyUser, obj: Any) -> list[str]:
    project = await _get_object_project(obj)
    workspace = await _get_object_workspace(obj)

    if not project and not workspace:
        return []

    is_workspace_member = await user_is_workspace_member(user=user, workspace=workspace)
    if project:
        is_project_admin, is_project_member, project_role_permissions = await get_user_project_role_info(
            user=user, project=project
        )

        user_permissions = await get_user_permissions_for_project(
            is_project_admin=is_project_admin,
            is_workspace_admin=is_workspace_member,
            is_project_member=is_project_member,
            is_authenticated=user.is_authenticated,
            project_role_permissions=project_role_permissions,
            project=project,
        )
    elif workspace:
        user_permissions = await get_user_permissions_for_workspace(is_workspace_member)

    return user_permissions


@sync_to_async
def _get_object_workspace(obj: Any) -> Workspace | None:
    if isinstance(obj, Workspace):
        return obj
    elif obj and hasattr(obj, "workspace"):
        return obj.workspace
    elif obj and hasattr(obj, "project"):
        return obj.project.workspace

    return None


@sync_to_async
def _get_object_project(obj: Any) -> Project | None:
    if isinstance(obj, Project):
        return obj
    elif obj and hasattr(obj, "project"):
        return obj.project

    return None


async def get_user_project_role_info(user: AnyUser, project: Project) -> tuple[bool, bool, list[str]]:
    if user.is_anonymous:
        return False, False, []

    role = await pj_roles_repositories.get_project_role(filters={"user_id": user.id, "project_id": project.id})
    if role:
        return role.is_admin, True, role.permissions

    return False, False, []


async def user_is_workspace_member(user: AnyUser, workspace: Workspace) -> bool:
    if user.is_anonymous:
        return False

    workspace_membership = await workspace_memberships_repositories.get_workspace_membership(
        filters={"user_id": user.id, "workspace_id": workspace.id},
    )
    return workspace_membership is not None


async def has_pending_project_invitation(user: AnyUser, project: Project) -> bool:
    if user.is_anonymous:
        return False

    invitation = await pj_invitations_repositories.get_project_invitation(
        filters={"user": user, "project": project, "status": ProjectInvitationStatus.PENDING}
    )
    return bool(invitation)


async def get_user_permissions_for_project(
    is_project_admin: bool,
    is_workspace_admin: bool,
    is_project_member: bool,
    is_authenticated: bool,
    project_role_permissions: list[str],
    project: Project,
) -> list[str]:
    # pj (user is)		ws (user is)	Applied permission role (referred to a project)
    # =================================================================================
    # pj-admin			ws-admin		role-pj-admin.permissions
    # pj-admin			no-role			role-pj-admin.permissions
    # pj-member			ws-admin		role-ws-admin [edit permissions over pj]
    # no-role			ws-admin		role-ws-admin [edit permissions over pj]
    # pj-member			no-role			role-pj-member.permissions
    # no-role			no-role			pj.public-permissions
    # no-logged			no-logged		pj.public-permissions [only view]
    if is_project_admin:
        return choices.ProjectPermissions.values
    elif is_workspace_admin:
        return choices.ProjectPermissions.values
    elif is_project_member:
        return project_role_permissions
    elif is_authenticated:
        return project.public_permissions or []

    return project.anon_permissions or []


async def get_user_permissions_for_workspace(is_workspace_member: bool) -> list[str]:
    if is_workspace_member:
        return [WorkspacePermissions.VIEW_WORKSPACE.value]

    return []


async def is_view_story_permission_deleted(old_permissions: list[str], new_permissions: list[str]) -> bool:
    if "view_story" in old_permissions and "view_story" not in new_permissions:
        return True
    return False


async def is_a_self_request(user: AnyUser, obj: Any) -> bool:
    if user.is_anonymous:
        return False

    if isinstance(obj, User):
        return obj == user
    elif obj and hasattr(obj, "user"):
        return obj.user == user

    return False
