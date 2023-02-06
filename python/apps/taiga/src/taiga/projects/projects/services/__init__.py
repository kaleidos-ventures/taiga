# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


from functools import partial
from typing import Any
from uuid import UUID

from fastapi import UploadFile
from taiga.base.db.models import File
from taiga.base.utils.images import get_thumbnail_url
from taiga.conf import settings
from taiga.events.actions import event_handlers as actions_events
from taiga.permissions import services as permissions_services
from taiga.projects.invitations.choices import ProjectInvitationStatus
from taiga.projects.memberships import repositories as pj_memberships_repositories
from taiga.projects.projects import events as projects_events
from taiga.projects.projects import repositories as projects_repositories
from taiga.projects.projects import tasks as projects_tasks
from taiga.projects.projects.models import Project
from taiga.projects.projects.serializers import ProjectDetailSerializer
from taiga.projects.projects.serializers import services as serializers_services
from taiga.projects.projects.services import exceptions as ex
from taiga.projects.roles import repositories as pj_roles_repositories
from taiga.users.models import AnyUser, User
from taiga.workspaces.roles import repositories as ws_roles_repositories
from taiga.workspaces.workspaces import services as workspaces_services
from taiga.workspaces.workspaces.models import Workspace

##########################################################
# create project
##########################################################


async def create_project_api(
    workspace: Workspace,
    name: str,
    description: str | None,
    color: int | None,
    owner: User,
    logo: UploadFile | None = None,
) -> ProjectDetailSerializer:
    project = await create_project(
        workspace=workspace, name=name, description=description, color=color, owner=owner, logo=logo
    )
    return await get_project_detail(project=project, user=owner)


async def create_project(
    workspace: Workspace,
    name: str,
    description: str | None,
    color: int | None,
    owner: User,
    logo: UploadFile | None = None,
) -> Project:
    logo_file = None
    if logo:
        logo_file = File(file=logo.file, name=logo.filename)

    project = await projects_repositories.create_project(
        workspace=workspace, name=name, description=description, color=color, owner=owner, logo=logo_file
    )

    # apply template
    template = await projects_repositories.get_project_template(filters={"slug": settings.DEFAULT_PROJECT_TEMPLATE})
    await projects_repositories.apply_template_to_project(template=template, project=project)

    # assign the owner to the project as the default role for owner (should be 'admin')
    owner_role = await (
        pj_roles_repositories.get_project_role(filters={"project_id": project.id, "slug": template.default_owner_role})
    )
    if not owner_role:
        owner_role = await (
            pj_roles_repositories.get_project_roles(filters={"project_id": project.id}, offset=0, limit=1)[0]
        )
    await pj_memberships_repositories.create_project_membership(user=owner, project=project, role=owner_role)

    return project


##########################################################
# list projects
##########################################################


async def list_projects(workspace_id: UUID) -> list[Project]:
    return await projects_repositories.list_projects(
        filters={"workspace_id": workspace_id},
        prefetch_related=["workspace"],
    )


async def list_workspace_projects_for_user(workspace: Workspace, user: User) -> list[Project]:
    role = await ws_roles_repositories.get_workspace_role(filters={"user_id": user.id, "workspace_id": workspace.id})
    if role and role.is_admin:
        return await list_projects(workspace_id=workspace.id)

    return await projects_repositories.list_projects(
        filters={"workspace_id": workspace.id, "project_or_workspace_member_id": user.id},
        prefetch_related=["workspace"],
    )


async def list_workspace_invited_projects_for_user(workspace: Workspace, user: User) -> list[Project]:
    return await projects_repositories.list_projects(
        filters={
            "workspace_id": workspace.id,
            "invitee_id": user.id,
            "invitation_status": ProjectInvitationStatus.PENDING,
        }
    )


async def list_workspace_member_permissions(project: Project) -> list[str]:
    if not project.workspace.is_premium:
        raise ex.NotPremiumWorkspaceError("The workspace is not a premium one, so these perms cannot be seen")

    return project.workspace_member_permissions or []


##########################################################
# get project
##########################################################


async def get_project(id: UUID) -> Project | None:
    return await projects_repositories.get_project(
        filters={"id": id},
        select_related=["workspace"],
    )


async def get_project_detail(project: Project, user: AnyUser) -> ProjectDetailSerializer:
    (
        is_project_admin,
        is_project_member,
        project_role_permissions,
    ) = await permissions_services.get_user_project_role_info(user=user, project=project)

    (
        is_workspace_admin,
        is_workspace_member,
        _,
    ) = await permissions_services.get_user_workspace_role_info(user=user, workspace=project.workspace)

    user_id = None if user.is_anonymous else user.id
    workspace = await workspaces_services.get_workspace_nested(id=project.workspace_id, user_id=user_id)

    user_permissions = await permissions_services.get_user_permissions_for_project(
        is_project_admin=is_project_admin,
        is_workspace_admin=is_workspace_admin,
        is_project_member=is_project_member,
        is_workspace_member=is_workspace_member,
        is_authenticated=user.is_authenticated,
        project_role_permissions=project_role_permissions,
        project=project,
    )

    user_has_pending_invitation = (
        False
        if user.is_anonymous
        # TODO: `has_pending_project_invitation` belongs to project, no to permissions
        else await (permissions_services.has_pending_project_invitation(user=user, project=project))
    )

    return serializers_services.serialize_project_detail(
        project=project,
        workspace=workspace,
        user_is_admin=is_project_admin,
        user_is_member=is_project_member,
        user_permissions=user_permissions,
        user_has_pending_invitation=user_has_pending_invitation,
    )


##########################################################
# update project
##########################################################


async def update_project_api(project: Project, user: User, values: dict[str, Any] = {}) -> ProjectDetailSerializer:
    updated_project = await update_project(project=project, values=values)
    return await get_project_detail(project=updated_project, user=user)


async def update_project(project: Project, values: dict[str, Any] = {}) -> Project:
    # Prevent hitting the database with an empty PATCH
    if len(values) == 0:
        return project

    if "name" in values:
        if values.get("name") is None or values.get("name") == "":
            raise ex.TaigaValidationError("Name cannot be empty")

    file_to_delete = None
    if "logo" in values:
        if logo := values.get("logo"):
            values["logo"] = File(file=logo.file, name=logo.filename)
        else:
            values["logo"] = None

        # Mark a file to-delete
        if project.logo:
            file_to_delete = project.logo.path

    # Update project
    updated_project = await projects_repositories.update_project(project=project, values=values)

    # Delete old file if existed
    if file_to_delete:
        await projects_tasks.delete_old_logo.defer(path=file_to_delete)

    return updated_project


async def update_project_public_permissions(project: Project, permissions: list[str]) -> list[str]:
    await projects_repositories.update_project(project=project, values={"public_permissions": permissions})

    # TODO: emit an event to users/project with the new permissions when a change happens?
    await projects_events.emit_event_when_project_permissions_are_updated(project=project)
    if not permissions:
        await actions_events.emit_event_action_to_check_project_subscription(project_b64id=project.b64id)

    return permissions


async def update_project_workspace_member_permissions(project: Project, permissions: list[str]) -> list[str]:
    if not project.workspace.is_premium:
        raise ex.NotPremiumWorkspaceError("The workspace is not a premium one, so these perms cannot be set")

    await projects_repositories.update_project(project=project, values={"workspace_member_permissions": permissions})
    await projects_events.emit_event_when_project_permissions_are_updated(project=project)
    if not permissions:
        await actions_events.emit_event_action_to_check_project_subscription(project_b64id=project.b64id)

    return permissions


##########################################################
# misc
##########################################################


async def get_logo_thumbnail_url(thumbnailer_size: str, logo_relative_path: str) -> str | None:
    if logo_relative_path:
        return await get_thumbnail_url(logo_relative_path, thumbnailer_size)
    return None


get_logo_small_thumbnail_url = partial(get_logo_thumbnail_url, settings.IMAGES.THUMBNAIL_PROJECT_LOGO_SMALL)
get_logo_large_thumbnail_url = partial(get_logo_thumbnail_url, settings.IMAGES.THUMBNAIL_PROJECT_LOGO_LARGE)
