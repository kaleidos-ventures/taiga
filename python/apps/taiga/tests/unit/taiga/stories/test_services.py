# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import patch

import pytest
from taiga.stories import services
from taiga.stories.services import exceptions as ex
from taiga.workflows import dataclasses as dt
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


#######################################################
# get_paginated_stories_by_workflow
#######################################################


async def test_get_project_invitation_ok():
    story = f.build_story()

    with (patch("taiga.stories.services.stories_repositories", autospec=True) as fake_stories_repo,):
        fake_stories_repo.get_total_stories_by_workflow.return_value = 1
        fake_stories_repo.get_stories_by_workflow.return_value = [story]
        await services.get_paginated_stories_by_workflow(
            project_slug=story.project.slug, workflow_slug=story.workflow.slug, offset=0, limit=10
        )
        fake_stories_repo.get_total_stories_by_workflow.assert_awaited_once_with(
            project_slug=story.project.slug, workflow_slug=story.workflow.slug
        )
        fake_stories_repo.get_stories_by_workflow.assert_awaited_once_with(
            project_slug=story.project.slug, workflow_slug=story.workflow.slug, offset=0, limit=10
        )


#######################################################
# create_story
#######################################################


async def test_create_story_ok():
    user = f.build_user()
    story = f.build_story()

    with (
        patch("taiga.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch("taiga.stories.services.stories_events", autospec=True) as fake_stories_events,
    ):
        fake_stories_repo.create_story.return_value = story

        await services.create_story(
            project=story.project,
            workflow=build_worklow_dt(story),
            title=story.title,
            status_slug=story.status.slug,
            user=user,
        )
        fake_stories_repo.create_story.assert_awaited_once_with(
            title=story.title,
            project_id=story.project.id,
            workflow_id=story.workflow.id,
            status_id=story.status.id,
            user_id=user.id,
        )
        fake_stories_events.emit_event_when_story_is_created.assert_awaited_once_with(story=story)


async def test_create_story_invalid_status():
    user = f.build_user()
    story1 = f.build_story()
    story2 = f.build_story()

    with (patch("taiga.stories.services.stories_events", autospec=True), pytest.raises(ex.InvalidStatusError)):

        await services.create_story(
            project=story1.project,
            workflow=build_worklow_dt(story1),
            title=story1.title,
            status_slug=story2.status.slug,
            user=user,
        )


#######################################################
# utils
#######################################################


def build_worklow_dt(story):
    return dt.Workflow(
        id=story.workflow.id,
        name=story.workflow.name,
        slug=story.workflow.slug,
        order=story.workflow.order,
        statuses=[story.status],
    )
