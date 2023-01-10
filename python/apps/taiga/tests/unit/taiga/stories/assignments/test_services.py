# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import patch

import pytest
from taiga.stories.assignments import services
from taiga.stories.assignments.services import exceptions as ex
from tests.utils import factories as f

pytestmark = pytest.mark.django_db

NO_VIEW_STORY_PERMISSIONS = {
    "view_project",
}


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
        await services.create_story_assignment(project_id=story.project.id, story=story, username=user.username)
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
        pytest.raises(ex.InvalidAssignmentError),
    ):
        fake_pj_memberships_repo.get_project_membership.return_value = None
        fake_story_assignment_repo.create_story_assignment.return_value = None, False

        await services.create_story_assignment(project_id=story.project.id, story=story, username=user.username)
        fake_stories_assignments_events.emit_event_when_story_assignment_is_created.assert_not_awaited()
        fake_story_assignment_repo.create_story_assignment.assert_not_awaited()


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
    ):
        fake_pj_memberships_repo.get_project_membership.return_value = membership
        fake_story_assignment_repo.create_story_assignment.return_value = story_assignment, True

        await services.create_story_assignment(project_id=project.id, story=story, username=user.username)
        fake_stories_assignments_events.emit_event_when_story_assignment_is_created.assert_awaited_once_with(
            story_assignment=story_assignment
        )
        fake_story_assignment_repo.create_story_assignment.assert_awaited_once_with(
            story=story,
            user=user,
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
    ):
        fake_pj_memberships_repo.get_project_membership.return_value = membership
        fake_story_assignment_repo.create_story_assignment.return_value = story_assignment, True

        await services.create_story_assignment(project_id=project.id, story=story, username=user.username)

        fake_story_assignment_repo.create_story_assignment.return_value = story_assignment, False

        await services.create_story_assignment(project_id=project.id, story=story, username=user.username)
        fake_stories_assignments_events.emit_event_when_story_assignment_is_created.assert_awaited_once_with(
            story_assignment=story_assignment
        )
        fake_story_assignment_repo.create_story_assignment.assert_awaited_with(
            story=story,
            user=user,
        )


#######################################################
# delete_story_assignment
#######################################################


async def test_delete_story_assignment_fail():
    user = f.build_user()
    story = f.build_story()
    f.build_story_assignment(story=story, user=user)

    with (
        patch(
            "taiga.stories.assignments.services.story_assignments_repositories", autospec=True
        ) as fake_story_assignment_repo,
        patch(
            "taiga.stories.assignments.services.stories_assignments_events", autospec=True
        ) as fake_stories_assignments_events,
    ):
        fake_story_assignment_repo.delete_story_assignment.return_value = 0

        await services.delete_story_assignment(story=story, username=user.username)
        fake_stories_assignments_events.emit_event_when_story_assignment_is_deleted.assert_not_awaited()

        fake_story_assignment_repo.delete_story_assignment.assert_awaited_once_with(
            filters={"story_id": story.id, "username": user.username},
        )


async def test_delete_story_assignment_ok():
    user = f.build_user()
    story = f.build_story()
    f.build_story_assignment(story=story, user=user)

    with (
        patch(
            "taiga.stories.assignments.services.story_assignments_repositories", autospec=True
        ) as fake_story_assignment_repo,
        patch(
            "taiga.stories.assignments.services.stories_assignments_events", autospec=True
        ) as fake_stories_assignments_events,
    ):
        fake_story_assignment_repo.delete_story_assignment.return_value = 1

        await services.delete_story_assignment(story=story, username=user.username)
        fake_stories_assignments_events.emit_event_when_story_assignment_is_deleted.assert_awaited_once_with(
            story=story, username=user.username
        )

        fake_story_assignment_repo.delete_story_assignment.assert_awaited_once_with(
            filters={"story_id": story.id, "username": user.username},
        )
