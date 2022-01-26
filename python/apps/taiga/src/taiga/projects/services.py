# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
from collections.abc import Iterable
from functools import partial
from typing import Optional, Union

from django.core.files import File
from fastapi import UploadFile
from taiga.base.utils.images import get_thumbnail_url
from taiga.conf import settings
from taiga.exceptions import services as ex
from taiga.permissions import services as permissions_services
from taiga.projects import repositories as projects_repo
from taiga.projects.models import Project
from taiga.roles import repositories as roles_repo
from taiga.roles import services as roles_services
from taiga.users.models import User
from taiga.workspaces.models import Workspace


def get_projects(workspace_slug: str) -> Iterable[Project]:
    return projects_repo.get_projects(workspace_slug=workspace_slug)


def get_workspace_projects_for_user(workspace: Workspace, user: User) -> Iterable[Project]:
    if roles_repo.is_workspace_admin(user_id=user.id, workspace_id=workspace.id):
        return get_projects(workspace_slug=workspace.slug)

    return projects_repo.get_workspace_projects_for_user(workspace_id=workspace.id, user_id=user.id)


def create_project(
    workspace: Workspace,
    name: str,
    description: Optional[str],
    color: Optional[int],
    owner: User,
    logo: Optional[UploadFile] = None,
) -> Project:
    logo_file = None
    if logo:
        logo_file = File(file=logo.file, name=logo.filename)

    project = projects_repo.create_project(
        workspace=workspace, name=name, description=description, color=color, owner=owner, logo=logo_file
    )

    # populate new project with default data
    template = projects_repo.get_template(slug=settings.DEFAULT_PROJECT_TEMPLATE)
    template.apply_to_project(project)

    # assign the owner to the project as the default owner role (should be 'admin')
    owner_role = roles_services.get_project_role(project=project, slug=template.default_owner_role)
    if not owner_role:
        owner_role = roles_repo.get_first_role(project=project)

    owner = projects_repo.get_project_owner(project)
    roles_repo.create_membership(user=owner, project=project, role=owner_role, email=None)

    # tags normalization
    project.tags = list(map(str.lower, project.tags))

    return project


def get_project(slug: str) -> Optional[Project]:
    return projects_repo.get_project(slug=slug)


def get_logo_thumbnail_url(thumbnailer_size: str, logo_relative_path: str) -> Union[str, None]:
    if logo_relative_path:
        return get_thumbnail_url(logo_relative_path, thumbnailer_size)
    return None


get_logo_small_thumbnail_url = partial(get_logo_thumbnail_url, settings.IMAGES.THUMBNAIL_PROJECT_LOGO_SMALL)
get_logo_large_thumbnail_url = partial(get_logo_thumbnail_url, settings.IMAGES.THUMBNAIL_PROJECT_LOGO_LARGE)


def update_project_public_permissions(project: Project, permissions: list[str]) -> list[str]:
    if not permissions_services.permissions_are_valid(permissions):
        raise ex.NotValidPermissionsSetError()

    if not permissions_services.permissions_are_compatible(permissions):
        raise ex.IncompatiblePermissionsSetError()

    # anon_permissions are the "view_" subset of the public_permissions
    anon_permissions = list(filter(lambda x: x.startswith("view_"), permissions))
    return projects_repo.update_project_public_permissions(
        project=project, permissions=permissions, anon_permissions=anon_permissions
    )


def update_project_workspace_member_permissions(project: Project, permissions: list[str]) -> list[str]:
    if not permissions_services.permissions_are_valid(permissions):
        raise ex.NotValidPermissionsSetError()

    if not permissions_services.permissions_are_compatible(permissions):
        raise ex.IncompatiblePermissionsSetError()

    if not projects_repo.project_is_in_premium_workspace(project):
        raise ex.NotPremiumWorkspaceError()

    return projects_repo.update_project_workspace_member_permissions(project=project, permissions=permissions)


def get_workspace_member_permissions(project: Project) -> list[str]:
    if not projects_repo.project_is_in_premium_workspace(project):
        raise ex.NotPremiumWorkspaceError()

    return project.workspace_member_permissions
