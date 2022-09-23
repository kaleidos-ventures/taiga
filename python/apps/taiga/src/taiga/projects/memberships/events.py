# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.events import events_manager
from taiga.projects.memberships.models import ProjectMembership


UPDATE_PROJECT_MEMBERSHIP = "projectmemberships.update"


async def emit_event_when_project_membership_is_updated(membership: ProjectMembership) -> None:
    await events_manager.publish_on_user_channel(
        user=membership.user, type=UPDATE_PROJECT_MEMBERSHIP, content={"project": membership.project.slug}
    )

    await events_manager.publish_on_project_channel(project=membership.project, type=UPDATE_PROJECT_MEMBERSHIP)
