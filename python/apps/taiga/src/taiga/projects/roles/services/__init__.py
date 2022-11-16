# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.permissions import services as permissions_services
from taiga.projects.projects.models import Project
from taiga.projects.roles import events as pj_roles_events
from taiga.projects.roles import repositories as pj_roles_repositories
from taiga.projects.roles.models import ProjectRole
from taiga.projects.roles.services import exceptions as ex


async def get_project_roles(project: Project) -> list[ProjectRole]:
    return await pj_roles_repositories.get_project_roles(filters={"project_id": project.id})


async def get_project_role(project: Project, slug: str) -> ProjectRole | None:
    return await (pj_roles_repositories.get_project_role(filters={"project_id": project.id, "slug": slug}))


async def get_project_roles_as_dict(project: Project) -> dict[str, ProjectRole]:
    """
    This method forms a custom dictionary with the roles matching a project
    :param project: The project to get their roles from
    :return: Dictionary whose key is the role slug and value the Role object
    """

    return {r.slug: r for r in await pj_roles_repositories.get_project_roles(filters={"project_id": project.id})}


async def update_project_role_permissions(role: ProjectRole, permissions: list[str]) -> ProjectRole:
    if role.is_admin:
        raise ex.NonEditableRoleError("Cannot edit permissions in an admin role")

    if not permissions_services.permissions_are_valid(permissions):
        raise ex.NotValidPermissionsSetError("One or more permissions are not valid. Maybe, there is a typo.")

    if not permissions_services.permissions_are_compatible(permissions):
        raise ex.IncompatiblePermissionsSetError("Given permissions are incompatible")

    role.permissions = permissions
    project_role_permissions = await (pj_roles_repositories.update_project_role_permissions(role=role))

    await pj_roles_events.emit_event_when_project_role_permissions_are_updated(role=role)

    return project_role_permissions
