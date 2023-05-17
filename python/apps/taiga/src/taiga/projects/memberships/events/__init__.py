# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.events import events_manager
from taiga.projects.memberships.events.content import DeleteProjectMembershipContent, ProjectMembershipContent
from taiga.projects.memberships.models import ProjectMembership

UPDATE_PROJECT_MEMBERSHIP = "projectmemberships.update"
DELETE_PROJECT_MEMBERSHIP = "projectmemberships.delete"


async def emit_event_when_project_membership_is_updated(membership: ProjectMembership) -> None:
    await events_manager.publish_on_user_channel(
        user=membership.user,
        type=UPDATE_PROJECT_MEMBERSHIP,
        content=ProjectMembershipContent(membership=membership),
    )

    await events_manager.publish_on_project_channel(
        project=membership.project,
        type=UPDATE_PROJECT_MEMBERSHIP,
        content=ProjectMembershipContent(membership=membership),
    )


async def emit_event_when_project_membership_is_deleted(membership: ProjectMembership) -> None:
    # for anyuser in the project detail or pj-admins in setting members
    await events_manager.publish_on_project_channel(
        project=membership.project,
        type=DELETE_PROJECT_MEMBERSHIP,
        content=DeleteProjectMembershipContent(membership=membership, workspace=membership.project.workspace_id),
    )

    # for deleted user in her home or in project detail
    await events_manager.publish_on_user_channel(
        user=membership.user,
        type=DELETE_PROJECT_MEMBERSHIP,
        content=DeleteProjectMembershipContent(membership=membership, workspace=membership.project.workspace_id),
    )

    # for ws-members in settings>people>non-members
    await events_manager.publish_on_workspace_channel(
        workspace=membership.project.workspace,
        type=DELETE_PROJECT_MEMBERSHIP,
        content=DeleteProjectMembershipContent(membership=membership, workspace=membership.project.workspace_id),
    )
