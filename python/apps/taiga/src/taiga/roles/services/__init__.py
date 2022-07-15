# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.base.api.pagination import Pagination
from taiga.permissions import services as permissions_services
from taiga.projects.models import Project
from taiga.roles import events as roles_events
from taiga.roles import repositories as roles_repositories
from taiga.roles.models import ProjectMembership, ProjectRole
from taiga.roles.services import exceptions as ex

###############################################################
# PROJECTS
###############################################################

# Roles


async def get_project_roles(project: Project) -> list[ProjectRole]:
    return await roles_repositories.get_project_roles(project)


async def get_project_role(project: Project, slug: str) -> ProjectRole | None:
    return await roles_repositories.get_project_role(project=project, slug=slug)


async def update_project_role_permissions(role: ProjectRole, permissions: list[str]) -> ProjectRole:
    if role.is_admin:
        raise ex.NonEditableRoleError("Cannot edit permissions in an admin role")

    if not permissions_services.permissions_are_valid(permissions):
        raise ex.NotValidPermissionsSetError("One or more permissions are not valid. Maybe, there is a typo.")

    if not permissions_services.permissions_are_compatible(permissions):
        raise ex.IncompatiblePermissionsSetError("Given permissions are incompatible")

    return await roles_repositories.update_project_role_permissions(role=role, permissions=permissions)


# ProjectMemberships


async def get_paginated_project_memberships(
    project: Project, offset: int, limit: int
) -> tuple[Pagination, list[ProjectMembership]]:
    memberships = await roles_repositories.get_project_memberships(
        project_slug=project.slug, offset=offset, limit=limit
    )
    total_memberships = await roles_repositories.get_total_project_memberships(project_slug=project.slug)

    pagination = Pagination(offset=offset, limit=limit, total=total_memberships)

    return pagination, memberships


async def get_project_membership(project_slug: str, username: str) -> ProjectMembership:
    return await roles_repositories.get_project_membership(project_slug=project_slug, username=username)


async def update_project_membership_role(membership: ProjectMembership, role_slug: str) -> ProjectMembership:
    project_role = await roles_repositories.get_project_role(project=membership.project, slug=role_slug)

    if not project_role:
        raise ex.NonExistingRoleError("Role does not exist")

    membership_role = membership.role

    if membership_role.is_admin and not project_role.is_admin:
        num_admins = await roles_repositories.get_num_members_by_role_id(role_id=membership_role.id)

        if num_admins == 1:
            raise ex.MembershipIsTheOnlyAdminError("Membership is the only admin")

    updated_membership = await roles_repositories.update_project_membership_role(
        membership=membership, role=project_role
    )
    await roles_events.emit_event_when_project_membership_role_is_updated(membership=membership)

    return updated_membership
