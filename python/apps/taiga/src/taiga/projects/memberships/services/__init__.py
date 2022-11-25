# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from uuid import UUID

from taiga.base.api.pagination import Pagination
from taiga.projects.memberships import events as memberships_events
from taiga.projects.memberships import repositories as memberships_repositories
from taiga.projects.memberships.models import ProjectMembership
from taiga.projects.memberships.services import exceptions as ex
from taiga.projects.projects.models import Project
from taiga.projects.roles import repositories as pj_roles_repositories
from taiga.projects.roles.models import ProjectRole


async def get_paginated_project_memberships(
    project: Project, offset: int, limit: int
) -> tuple[Pagination, list[ProjectMembership]]:
    memberships = await memberships_repositories.get_project_memberships(
        filters={"project_id": project.id}, offset=offset, limit=limit
    )
    total_memberships = await memberships_repositories.get_total_project_memberships(filters={"project_id": project.id})

    pagination = Pagination(offset=offset, limit=limit, total=total_memberships)

    return pagination, memberships


async def get_project_membership(project_id: UUID, username: str) -> ProjectMembership:
    return await memberships_repositories.get_project_membership(
        filters={"project_id": project_id, "username": username}
    )


async def _is_membership_the_only_admin(membership_role: ProjectRole, project_role: ProjectRole) -> bool:
    if membership_role.is_admin and not project_role.is_admin:
        num_admins = await memberships_repositories.get_total_project_memberships(
            filters={"role_id": membership_role.id}
        )
        return True if num_admins == 1 else False
    else:
        return False


async def update_project_membership(membership: ProjectMembership, role_slug: str) -> ProjectMembership:
    project_role = await (
        pj_roles_repositories.get_project_role(filters={"project_id": membership.project_id, "slug": role_slug})
    )

    if not project_role:
        raise ex.NonExistingRoleError("Role does not exist")

    if await _is_membership_the_only_admin(membership_role=membership.role, project_role=project_role):
        raise ex.MembershipIsTheOnlyAdminError("Membership is the only admin")

    membership.role = project_role
    updated_membership = await memberships_repositories.update_project_membership(membership=membership)

    await memberships_events.emit_event_when_project_membership_is_updated(membership=updated_membership)

    return updated_membership
