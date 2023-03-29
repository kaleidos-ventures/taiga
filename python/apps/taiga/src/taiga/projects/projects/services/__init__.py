# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from functools import partial
from typing import Any
from uuid import UUID

from fastapi import UploadFile
from taiga.base.utils.files import uploadfile_to_file
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
from taiga.users import services as users_services
from taiga.users.models import AnyUser, User
from taiga.workspaces.memberships import repositories as workspace_memberships_repositories
from taiga.workspaces.workspaces import services as workspaces_services
from taiga.workspaces.workspaces.models import Workspace

##########################################################
# create project
##########################################################


async def create_project(
    workspace: Workspace,
    name: str,
    description: str | None,
    color: int | None,
    created_by: User,
    logo: UploadFile | None = None,
) -> ProjectDetailSerializer:
    project = await _create_project(
        workspace=workspace, name=name, description=description, color=color, created_by=created_by, logo=logo
    )
    return await get_project_detail(project=project, user=created_by)


async def _create_project(
    workspace: Workspace,
    name: str,
    description: str | None,
    color: int | None,
    created_by: User,
    logo: UploadFile | None = None,
) -> Project:
    logo_file = None
    if logo:
        logo_file = uploadfile_to_file(file=logo)

    project = await projects_repositories.create_project(
        workspace=workspace, name=name, description=description, color=color, created_by=created_by, logo=logo_file
    )

    # apply template
    template = await projects_repositories.get_project_template(filters={"slug": settings.DEFAULT_PROJECT_TEMPLATE})
    await projects_repositories.apply_template_to_project(template=template, project=project)

    # assign 'created_by' to the project as 'admin' role
    admin_role = await (pj_roles_repositories.get_project_role(filters={"project_id": project.id, "slug": "admin"}))
    await pj_memberships_repositories.create_project_membership(user=created_by, project=project, role=admin_role)

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
    ws_membership = await workspace_memberships_repositories.get_workspace_membership(
        filters={"workspace_id": workspace.id, "user_id": user.id},
        select_related=[],
    )
    if ws_membership:
        return await list_projects(workspace_id=workspace.id)

    return await projects_repositories.list_projects(
        filters={"workspace_id": workspace.id, "project_member_id": user.id},
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

    is_workspace_member = await permissions_services.user_is_workspace_member(user=user, workspace=project.workspace)

    user_id = None if user.is_anonymous else user.id
    workspace = await workspaces_services.get_workspace_nested(id=project.workspace_id, user_id=user_id)

    user_permissions = await permissions_services.get_user_permissions_for_project(
        is_project_admin=is_project_admin,
        is_workspace_admin=is_workspace_member,
        is_project_member=is_project_member,
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


async def update_project(project: Project, user: User, values: dict[str, Any] = {}) -> ProjectDetailSerializer:
    updated_project = await _update_project(project=project, values=values)
    return await get_project_detail(project=updated_project, user=user)


async def _update_project(project: Project, values: dict[str, Any] = {}) -> Project:
    # Prevent hitting the database with an empty PATCH
    if len(values) == 0:
        return project

    if "name" in values:
        if values.get("name") is None or values.get("name") == "":
            raise ex.TaigaValidationError("Name cannot be empty")

    file_to_delete = None
    if "logo" in values:
        if logo := values.get("logo"):
            values["logo"] = uploadfile_to_file(file=logo)
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


##########################################################
# delete project
##########################################################


async def delete_project(project: Project, deleted_by: AnyUser) -> bool:
    guests = await users_services.list_guests_in_workspace_for_project(project=project)
    deleted = await projects_repositories.delete_projects(filters={"id": project.id})
    if deleted > 0:
        await projects_events.emit_event_when_project_is_deleted(
            workspace=project.workspace, project=project, deleted_by=deleted_by, guests=guests
        )
        return True

    return False


##########################################################
# misc
##########################################################


async def get_logo_thumbnail_url(thumbnailer_size: str, logo_relative_path: str) -> str | None:
    if logo_relative_path:
        return await get_thumbnail_url(logo_relative_path, thumbnailer_size)
    return None


get_logo_small_thumbnail_url = partial(get_logo_thumbnail_url, settings.IMAGES.THUMBNAIL_PROJECT_LOGO_SMALL)
get_logo_large_thumbnail_url = partial(get_logo_thumbnail_url, settings.IMAGES.THUMBNAIL_PROJECT_LOGO_LARGE)
