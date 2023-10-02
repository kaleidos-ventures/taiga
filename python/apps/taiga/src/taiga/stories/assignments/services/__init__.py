# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from uuid import UUID

from taiga.projects.memberships import repositories as pj_memberships_repositories
from taiga.stories.assignments import events as stories_assignments_events
from taiga.stories.assignments import notifications as stories_assignments_notifications
from taiga.stories.assignments import repositories as story_assignments_repositories
from taiga.stories.assignments.models import StoryAssignment
from taiga.stories.assignments.services import exceptions as ex
from taiga.stories.stories.models import Story
from taiga.users.models import User

##########################################################
# create story assignment
##########################################################


async def create_story_assignment(project_id: UUID, story: Story, username: str, created_by: User) -> StoryAssignment:
    pj_membership = await pj_memberships_repositories.get_project_membership(
        filters={"project_id": project_id, "username": username, "permissions": ["view_story"]}
    )
    if pj_membership is None:
        raise ex.InvalidAssignmentError(f"{username} is not member or not have permissions")

    user = pj_membership.user

    story_assignment, created = await story_assignments_repositories.create_story_assignment(story=story, user=user)
    if created:
        await stories_assignments_events.emit_event_when_story_assignment_is_created(story_assignment=story_assignment)
        await stories_assignments_notifications.notify_when_story_is_assigned(
            story=story, assigned_to=user, emitted_by=created_by
        )

    return story_assignment


##########################################################
# get story assignment
##########################################################


async def get_story_assignment(project_id: UUID, ref: int, username: str) -> StoryAssignment | None:
    return await story_assignments_repositories.get_story_assignment(
        filters={"project_id": project_id, "ref": ref, "username": username},
        select_related=["story", "user", "project", "workspace"],
    )


##########################################################
# delete story assignment
##########################################################


async def delete_story_assignment(story_assignment: StoryAssignment, story: Story, deleted_by: User) -> bool:
    deleted = await story_assignments_repositories.delete_stories_assignments(filters={"id": story_assignment.id})
    if deleted > 0:
        await stories_assignments_events.emit_event_when_story_assignment_is_deleted(story_assignment=story_assignment)
        await stories_assignments_notifications.notify_when_story_is_unassigned(
            story=story, unassigned_to=story_assignment.user, emitted_by=deleted_by
        )
        return True
    return False
