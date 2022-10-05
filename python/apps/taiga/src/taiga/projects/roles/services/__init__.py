# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.permissions import services as permissions_services
from taiga.projects.projects.models import Project
from taiga.projects.roles import events, repositories
from taiga.projects.roles.models import ProjectRole
from taiga.projects.roles.services import exceptions as ex


async def get_project_roles(project: Project) -> list[ProjectRole]:
    return await repositories.get_project_roles(project)


async def get_project_role(project: Project, slug: str) -> ProjectRole | None:
    return await repositories.get_project_role(project=project, slug=slug)


async def update_project_role_permissions(role: ProjectRole, permissions: list[str]) -> ProjectRole:
    if role.is_admin:
        raise ex.NonEditableRoleError("Cannot edit permissions in an admin role")

    if not permissions_services.permissions_are_valid(permissions):
        raise ex.NotValidPermissionsSetError("One or more permissions are not valid. Maybe, there is a typo.")

    if not permissions_services.permissions_are_compatible(permissions):
        raise ex.IncompatiblePermissionsSetError("Given permissions are incompatible")

    project_role_permissions = await (repositories.update_project_role_permissions(role=role, permissions=permissions))

    await events.emit_event_when_project_role_permissions_are_updated(role=role)

    return project_role_permissions
