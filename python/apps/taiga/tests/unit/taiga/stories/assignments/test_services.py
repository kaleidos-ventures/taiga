# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from unittest.mock import patch

import pytest
from taiga.stories.assignments import services
from taiga.stories.assignments.services import exceptions as ex
from tests.utils import factories as f

pytestmark = pytest.mark.django_db

NO_VIEW_STORY_PERMISSIONS = {}


#######################################################
# create_story_assignment
#######################################################


async def test_create_story_assignment_not_member():
    user = f.build_user()
    story = f.build_story()
    f.build_story_assignment(story=story, user=user)

    with (
        patch(
            "taiga.stories.assignments.services.story_assignments_repositories", autospec=True
        ) as fake_story_assignment_repo,
        pytest.raises(ex.InvalidAssignmentError),
    ):
        await services.create_story_assignment(
            project_id=story.project.id, story=story, username=user.username, created_by=story.created_by
        )
        fake_story_assignment_repo.create_story_assignment.assert_not_awaited()


async def test_create_story_assignment_user_without_view_story_permission():
    user = f.build_user()
    project = f.build_project()
    role = f.build_project_role(project=project, permissions=list(NO_VIEW_STORY_PERMISSIONS), is_admin=False)
    f.build_project_membership(user=user, project=project, role=role)
    story = f.build_story(project=project)
    f.build_story_assignment(story=story, user=user)

    with (
        patch(
            "taiga.stories.assignments.services.pj_memberships_repositories", autospec=True
        ) as fake_pj_memberships_repo,
        patch(
            "taiga.stories.assignments.services.story_assignments_repositories", autospec=True
        ) as fake_story_assignment_repo,
        patch(
            "taiga.stories.assignments.services.stories_assignments_events", autospec=True
        ) as fake_stories_assignments_events,
        patch(
            "taiga.stories.assignments.services.stories_assignments_notifications", autospec=True
        ) as fake_stories_assignments_notifications,
        pytest.raises(ex.InvalidAssignmentError),
    ):
        fake_pj_memberships_repo.get_project_membership.return_value = None
        fake_story_assignment_repo.create_story_assignment.return_value = None, False

        await services.create_story_assignment(
            project_id=story.project.id, story=story, username=user.username, created_by=story.created_by
        )
        fake_story_assignment_repo.create_story_assignment.assert_not_awaited()
        fake_stories_assignments_events.emit_event_when_story_assignment_is_created.assert_not_awaited()
        fake_stories_assignments_notifications.notify_when_story_is_assigned.assert_not_awaited()


async def test_create_story_assignment_ok():
    user = f.build_user()
    project = f.build_project()
    role = f.build_project_role(project=project)
    membership = f.build_project_membership(user=user, project=project, role=role)
    story = f.build_story(project=project)
    story_assignment = f.build_story_assignment(story=story, user=user)

    with (
        patch(
            "taiga.stories.assignments.services.pj_memberships_repositories", autospec=True
        ) as fake_pj_memberships_repo,
        patch(
            "taiga.stories.assignments.services.story_assignments_repositories", autospec=True
        ) as fake_story_assignment_repo,
        patch(
            "taiga.stories.assignments.services.stories_assignments_events", autospec=True
        ) as fake_stories_assignments_events,
        patch(
            "taiga.stories.assignments.services.stories_assignments_notifications", autospec=True
        ) as fake_stories_assignments_notifications,
    ):
        fake_pj_memberships_repo.get_project_membership.return_value = membership
        fake_story_assignment_repo.create_story_assignment.return_value = story_assignment, True

        await services.create_story_assignment(
            project_id=project.id, story=story, username=user.username, created_by=story.created_by
        )
        fake_story_assignment_repo.create_story_assignment.assert_awaited_once_with(
            story=story,
            user=user,
        )
        fake_stories_assignments_events.emit_event_when_story_assignment_is_created.assert_awaited_once_with(
            story_assignment=story_assignment
        )
        fake_stories_assignments_notifications.notify_when_story_is_assigned.assert_awaited_once_with(
            story=story, assigned_to=user, emitted_by=story.created_by
        )


async def test_create_story_assignment_already_assignment():
    user = f.build_user()
    project = f.build_project()
    role = f.build_project_role(project=project)
    membership = f.build_project_membership(user=user, project=project, role=role)
    story = f.build_story(project=project)
    story_assignment = f.build_story_assignment(story=story, user=user)

    with (
        patch(
            "taiga.stories.assignments.services.pj_memberships_repositories", autospec=True
        ) as fake_pj_memberships_repo,
        patch(
            "taiga.stories.assignments.services.story_assignments_repositories", autospec=True
        ) as fake_story_assignment_repo,
        patch(
            "taiga.stories.assignments.services.stories_assignments_events", autospec=True
        ) as fake_stories_assignments_events,
        patch(
            "taiga.stories.assignments.services.stories_assignments_notifications", autospec=True
        ) as fake_stories_assignments_notifications,
    ):
        fake_pj_memberships_repo.get_project_membership.return_value = membership
        fake_story_assignment_repo.create_story_assignment.return_value = story_assignment, True

        await services.create_story_assignment(
            project_id=project.id, story=story, username=user.username, created_by=story.created_by
        )

        fake_story_assignment_repo.create_story_assignment.return_value = story_assignment, False

        await services.create_story_assignment(
            project_id=project.id, story=story, username=user.username, created_by=story.created_by
        )
        fake_story_assignment_repo.create_story_assignment.assert_awaited_with(
            story=story,
            user=user,
        )
        fake_stories_assignments_events.emit_event_when_story_assignment_is_created.assert_awaited_once_with(
            story_assignment=story_assignment
        )
        fake_stories_assignments_notifications.notify_when_story_is_assigned.assert_awaited_once_with(
            story=story, assigned_to=user, emitted_by=story.created_by
        )


#######################################################
# get_story_assignment
#######################################################


async def test_get_story_assignment():
    user = f.build_user()
    story = f.build_story()
    story_assignment = f.build_story_assignment(story=story, user=user)

    with (
        patch(
            "taiga.stories.assignments.services.story_assignments_repositories", autospec=True
        ) as fake_story_assignment_repo,
    ):
        fake_story_assignment_repo.get_story_assignment.return_value = story_assignment

        await services.get_story_assignment(project_id=story.project.id, ref=story.ref, username=user.username)

        fake_story_assignment_repo.get_story_assignment.assert_awaited_once_with(
            filters={"project_id": story.project.id, "ref": story.ref, "username": user.username},
            select_related=["story", "user", "project", "workspace"],
        )


#######################################################
# delete_story_assignment
#######################################################


async def test_delete_story_assignment_fail():
    user = f.build_user()
    story = f.build_story()
    story_assignment = f.build_story_assignment(story=story, user=user)

    with (
        patch(
            "taiga.stories.assignments.services.story_assignments_repositories", autospec=True
        ) as fake_story_assignment_repo,
        patch(
            "taiga.stories.assignments.services.stories_assignments_events", autospec=True
        ) as fake_stories_assignments_events,
        patch(
            "taiga.stories.assignments.services.stories_assignments_notifications", autospec=True
        ) as fake_stories_assignments_notifications,
    ):
        fake_story_assignment_repo.delete_stories_assignments.return_value = 0

        await services.delete_story_assignment(
            story=story, story_assignment=story_assignment, deleted_by=story.created_by
        )
        fake_story_assignment_repo.delete_stories_assignments.assert_awaited_once_with(
            filters={"id": story_assignment.id},
        )
        fake_stories_assignments_events.emit_event_when_story_assignment_is_deleted.assert_not_awaited()
        fake_stories_assignments_notifications.notify_when_story_is_unassigned.assert_not_awaited()


async def test_delete_story_assignment_ok():
    user = f.build_user()
    story = f.build_story()
    story_assignment = f.build_story_assignment(story=story, user=user)

    with (
        patch(
            "taiga.stories.assignments.services.story_assignments_repositories", autospec=True
        ) as fake_story_assignment_repo,
        patch(
            "taiga.stories.assignments.services.stories_assignments_events", autospec=True
        ) as fake_stories_assignments_events,
        patch(
            "taiga.stories.assignments.services.stories_assignments_notifications", autospec=True
        ) as fake_stories_assignments_notifications,
    ):
        fake_story_assignment_repo.delete_stories_assignments.return_value = 1

        await services.delete_story_assignment(
            story=story, story_assignment=story_assignment, deleted_by=story.created_by
        )
        fake_story_assignment_repo.delete_stories_assignments.assert_awaited_once_with(
            filters={"id": story_assignment.id},
        )
        fake_stories_assignments_events.emit_event_when_story_assignment_is_deleted.assert_awaited_once_with(
            story_assignment=story_assignment
        )
        fake_stories_assignments_notifications.notify_when_story_is_unassigned.assert_awaited_once_with(
            story=story, unassigned_to=user, emitted_by=story.created_by
        )
