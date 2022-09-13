# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.events import events_manager
from taiga.projects.models import ProjectMembership, ProjectRole
from taiga.roles.serializers import BaseProjectRoleSerializer

UPDATE_PROJECT_MEMBERSHIP = "projectmemberships.update"
UPDATE_PROJECT_ROLE_PERMISSIONS = "projectroles.update"


async def emit_event_when_project_membership_is_updated(membership: ProjectMembership) -> None:
    await events_manager.publish_on_user_channel(
        user=membership.user, type=UPDATE_PROJECT_MEMBERSHIP, content={"project": membership.project.slug}
    )

    await events_manager.publish_on_project_channel(project=membership.project, type=UPDATE_PROJECT_MEMBERSHIP)


async def emit_event_when_project_role_permissions_are_updated(role: ProjectRole) -> None:
    """
    This event is emitted whenever the permissions list changes for a role
    :param role: The project role affected by the permission change
    """
    await events_manager.publish_on_project_channel(
        project=role.project,
        type=UPDATE_PROJECT_ROLE_PERMISSIONS,
        content=BaseProjectRoleSerializer(name=role.name, slug=role.slug, is_admin=role.is_admin).dict(),
    )
