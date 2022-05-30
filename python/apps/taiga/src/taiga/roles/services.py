# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.permissions import services as permissions_services
from taiga.projects.models import Project
from taiga.roles import exceptions as ex
from taiga.roles import repositories as roles_repositories
from taiga.roles.models import Membership, Role

###############################################################
# PROJECTS
###############################################################

# Roles


async def get_project_roles(project: Project) -> list[Role]:
    return await roles_repositories.get_project_roles(project)


async def get_project_role(project: Project, slug: str) -> Role | None:
    return await roles_repositories.get_project_role(project=project, slug=slug)


async def update_role_permissions(role: Role, permissions: list[str]) -> Role:
    if role.is_admin:
        raise ex.NonEditableRoleError("Cannot edit permissions in an admin role")

    if not permissions_services.permissions_are_valid(permissions):
        raise ex.NotValidPermissionsSetError("One or more permissions are not valid. Maybe, there is a typo.")

    if not permissions_services.permissions_are_compatible(permissions):
        raise ex.IncompatiblePermissionsSetError("Given permissions are incompatible")

    return await roles_repositories.update_role_permissions(role=role, permissions=permissions)


async def get_project_memberships(project: Project) -> list[Membership]:
    return await roles_repositories.get_project_memberships(project.slug)
