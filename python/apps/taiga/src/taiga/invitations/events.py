# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.events import events_manager
from taiga.invitations.models import Invitation
from taiga.projects.models import Project
from taiga.users.models import User

CREATE_PROJECT_INVITATION = "projectinvitations.create"


async def emit_event_when_project_invitations_are_created(
    project: Project, invitations: Invitation, invited_by: User
) -> None:
    # Publish event on every user channel
    for invitation in filter(lambda i: i.user, invitations):
        await events_manager.publish_on_user_channel(
            user=invitation.user,
            type=CREATE_PROJECT_INVITATION,
            sender=invited_by,
            content={"project": invitation.project.slug},
        )

    # TODO: for future events in the project
    # # Publish on the project channel
    # if invitations:
    #     await events_manager.publish_on_project_channel(
    #         project=project,
    #         type=CREATE_INVITATION
    #     )
