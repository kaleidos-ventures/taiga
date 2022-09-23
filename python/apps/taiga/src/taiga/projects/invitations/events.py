# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Iterable

from taiga.events import events_manager
from taiga.projects.invitations.models import ProjectInvitation
from taiga.projects.projects.models import Project

CREATE_PROJECT_INVITATION = "projectinvitations.create"
UPDATE_PROJECT_INVITATION = "projectinvitations.update"
ACCEPT_PROJECT_INVITATION = "projectmemberships.create"
REVOKE_PROJECT_INVITATION = "projectinvitations.revoke"


async def emit_event_when_project_invitations_are_created(
    project: Project, invitations: Iterable[ProjectInvitation]
) -> None:
    # Publish event on every user channel
    for invitation in filter(lambda i: i.user, invitations):
        await events_manager.publish_on_user_channel(
            user=invitation.user,  # type: ignore[arg-type]
            type=CREATE_PROJECT_INVITATION,
            content={"workspace": invitation.project.workspace.slug, "project": invitation.project.slug},
        )

    # Publish on the project channel
    if invitations:
        await events_manager.publish_on_project_channel(
            project=project,
            type=CREATE_PROJECT_INVITATION,
        )


async def emit_event_when_project_invitation_is_updated(invitation: ProjectInvitation) -> None:
    await events_manager.publish_on_project_channel(
        project=invitation.project,
        type=UPDATE_PROJECT_INVITATION,
    )
    if invitation.user:
        await events_manager.publish_on_user_channel(
            user=invitation.user,
            type=UPDATE_PROJECT_INVITATION,
            content={"workspace": invitation.project.workspace.slug, "project": invitation.project.slug},
        )


async def emit_event_when_project_invitations_are_updated(invitations: list[ProjectInvitation]) -> None:
    for invitation in invitations:
        await emit_event_when_project_invitation_is_updated(invitation)


async def emit_event_when_project_invitation_is_accepted(invitation: ProjectInvitation) -> None:
    await events_manager.publish_on_project_channel(
        project=invitation.project,
        type=ACCEPT_PROJECT_INVITATION,
    )
    if invitation.user:
        await events_manager.publish_on_user_channel(
            user=invitation.user,
            type=ACCEPT_PROJECT_INVITATION,
            content={"workspace": invitation.project.workspace.slug, "project": invitation.project.slug},
        )


async def emit_event_when_project_invitation_is_revoked(invitation: ProjectInvitation) -> None:
    await events_manager.publish_on_project_channel(
        project=invitation.project,
        type=REVOKE_PROJECT_INVITATION,
    )
    if invitation.user:
        await events_manager.publish_on_user_channel(
            user=invitation.user,
            type=REVOKE_PROJECT_INVITATION,
            content={"workspace": invitation.project.workspace.slug, "project": invitation.project.slug},
        )
