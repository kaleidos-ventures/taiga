# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from uuid import UUID

from taiga.permissions import services as permissions_services
from taiga.projects.memberships import repositories as pj_memberships_repositories
from taiga.stories.assignments import events as stories_assignments_events
from taiga.stories.assignments import repositories as story_assignments_repositories
from taiga.stories.assignments.models import StoryAssignment
from taiga.stories.assignments.services import exceptions as ex
from taiga.stories.stories.models import Story

##########################################################
# create story assignment
##########################################################


async def create_story_assignment(project_id: UUID, story: Story, username: str) -> StoryAssignment:
    pj_membership = await pj_memberships_repositories.get_project_membership(
        filters={"project_id": project_id, "username": username}
    )
    if pj_membership is None:
        raise ex.IsNotMemberError(f"{username} is not member of this project")

    user = pj_membership.user

    has_perm = await permissions_services.user_has_perm(user=user, perm="view_story", obj=story)
    if has_perm is False:
        raise ex.NotViewStoryPermissionError(f"{username} does not have permission to view story")

    story_assignment, created = await story_assignments_repositories.create_story_assignment(story=story, user=user)
    if created:
        await stories_assignments_events.emit_event_when_story_assignment_is_created(story_assignment=story_assignment)

    return story_assignment
