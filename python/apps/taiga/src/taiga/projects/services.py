# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
from functools import partial

from django.core.files import File
from fastapi import UploadFile
from taiga.base.utils.images import get_thumbnail_url
from taiga.conf import settings
from taiga.permissions import services as permissions_services
from taiga.projects import exceptions as ex
from taiga.projects import repositories as projects_repositories
from taiga.projects.models import Project
from taiga.roles import repositories as roles_repositories
from taiga.users.models import User
from taiga.workspaces import repositories as workspaces_repositories
from taiga.workspaces.models import Workspace


async def get_projects(workspace_slug: str) -> list[Project]:
    return await projects_repositories.get_projects(workspace_slug=workspace_slug)


async def get_workspace_projects_for_user(workspace: Workspace, user: User) -> list[Project]:
    role = await roles_repositories.get_workspace_role_for_user(user_id=user.id, workspace_id=workspace.id)
    if role and role.is_admin:
        return await get_projects(workspace_slug=workspace.slug)

    return await projects_repositories.get_workspace_projects_for_user(workspace_id=workspace.id, user_id=user.id)


async def get_workspace_invited_projects_for_user(workspace: Workspace, user: User) -> list[Project]:
    return await projects_repositories.get_workspace_invited_projects_for_user(
        workspace_id=workspace.id, user_id=user.id
    )


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

    template = await projects_repositories.get_template(slug=settings.DEFAULT_PROJECT_TEMPLATE)

    project = await projects_repositories.create_project(
        workspace=workspace,
        name=name,
        description=description,
        color=color,
        owner=owner,
        logo=logo_file,
        template=template,
    )

    # assign the owner to the project as the default owner role (should be 'admin')
    owner_role = await roles_repositories.get_project_role(project=project, slug=template.default_owner_role)
    if not owner_role:
        owner_role = await roles_repositories.get_first_role(project=project)

    await roles_repositories.create_membership(user=owner, project=project, role=owner_role)

    return project


async def get_project(slug: str) -> Project | None:
    return await projects_repositories.get_project(slug=slug)


async def get_project_detail(project: Project, user: User) -> Project:
    (
        is_project_admin,
        is_project_member,
        project_role_permissions,
    ) = await permissions_services.get_user_project_role_info(user=user, project=project)
    (is_workspace_admin, is_workspace_member, _) = await permissions_services.get_user_workspace_role_info(
        user=user, workspace=project.workspace
    )
    project.my_permissions = await permissions_services.get_user_permissions_for_project(
        is_project_admin=is_project_admin,
        is_workspace_admin=is_workspace_admin,
        is_project_member=is_project_member,
        is_workspace_member=is_workspace_member,
        is_authenticated=user.is_authenticated,
        project_role_permissions=project_role_permissions,
        project=project,
    )
    project.am_i_admin = is_project_admin
    project.workspace = await workspaces_repositories.get_workspace_summary(id=project.workspace.id, user_id=user.id)
    return project


async def get_logo_thumbnail_url(thumbnailer_size: str, logo_relative_path: str) -> str | None:
    if logo_relative_path:
        return await get_thumbnail_url(logo_relative_path, thumbnailer_size)
    return None


get_logo_small_thumbnail_url = partial(get_logo_thumbnail_url, settings.IMAGES.THUMBNAIL_PROJECT_LOGO_SMALL)
get_logo_large_thumbnail_url = partial(get_logo_thumbnail_url, settings.IMAGES.THUMBNAIL_PROJECT_LOGO_LARGE)


async def update_project_public_permissions(project: Project, permissions: list[str]) -> list[str]:
    if not permissions_services.permissions_are_valid(permissions):
        raise ex.NotValidPermissionsSetError("One or more permissions are not valid. Maybe, there is a typo.")

    if not permissions_services.permissions_are_compatible(permissions):
        raise ex.IncompatiblePermissionsSetError("Given permissions are incompatible")

    # anon_permissions are the "view_" subset of the public_permissions
    anon_permissions = list(filter(lambda x: x.startswith("view_"), permissions))
    return await projects_repositories.update_project_public_permissions(
        project=project, permissions=permissions, anon_permissions=anon_permissions
    )


async def update_project_workspace_member_permissions(project: Project, permissions: list[str]) -> list[str]:
    if not permissions_services.permissions_are_valid(permissions):
        raise ex.NotValidPermissionsSetError("One or more permissions are not valid. Maybe, there is a typo.")

    if not permissions_services.permissions_are_compatible(permissions):
        raise ex.IncompatiblePermissionsSetError("Given permissions are incompatible")

    if not await projects_repositories.project_is_in_premium_workspace(project):
        raise ex.NotPremiumWorkspaceError("The workspace is not a premium one, so these perms cannot be set")

    return await projects_repositories.update_project_workspace_member_permissions(
        project=project, permissions=permissions
    )


async def get_workspace_member_permissions(project: Project) -> list[str]:
    if not await projects_repositories.project_is_in_premium_workspace(project):
        raise ex.NotPremiumWorkspaceError("The workspace is not a premium one, so these perms cannot be seen")

    return project.workspace_member_permissions
