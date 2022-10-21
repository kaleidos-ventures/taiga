# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import patch

import pytest
from taiga.stories import services
from taiga.stories.models import Story
from taiga.stories.services import exceptions as ex
from taiga.workflows import dataclasses as dt
from taiga.workflows.models import WorkflowStatus
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
        fake_stories_repo.get_max_order.return_value = 0

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
            order=100,
        )
        fake_stories_events.emit_event_when_story_is_created.assert_awaited_once_with(story=story)


async def test_create_story_invalid_status():
    user = f.build_user()
    story1 = f.build_story()
    story2 = f.build_story()

    with (pytest.raises(ex.InvalidStatusError)):

        await services.create_story(
            project=story1.project,
            workflow=build_worklow_dt(story1),
            title=story1.title,
            status_slug=story2.status.slug,
            user=user,
        )


#######################################################
# reorder_stories
#######################################################


async def test_reorder_stories_ok():

    with (
        patch("taiga.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        patch("taiga.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        patch("taiga.stories.services.stories_events", autospec=True) as fake_stories_events,
    ):
        target_status = f.build_workflow_status()
        fake_workflows_repo.get_status.return_value = target_status
        reorder_story = f.build_story(ref=3)
        fake_stories_repo.get_story.return_value = reorder_story
        s1 = f.build_story(ref=13)
        s2 = f.build_story(ref=54)
        s3 = f.build_story(ref=2)
        fake_stories_repo.get_stories_to_reorder.return_value = [s1, s2, s3]

        await services.reorder_stories(
            project=f.build_project(),
            target_status_slug=target_status.slug,
            workflow=f.build_workflow(),
            stories_refs=[13, 54, 2],
            reorder={"place": "after", "ref": reorder_story.ref},
        )

        fake_stories_repo.reorder_stories.assert_awaited_once_with(
            target_status=target_status,
            stories_to_reorder=[s1, s2, s3],
            reorder_story=reorder_story,
            reorder_place="after",
        )
        fake_stories_events.emit_when_stories_are_reordered.assert_awaited_once()


async def test_reorder_story_workflowstatus_does_not_exist():
    with (
        patch("taiga.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        pytest.raises(ex.InvalidStatusError),
    ):
        fake_workflows_repo.get_status.side_effect = WorkflowStatus.DoesNotExist

        await services.reorder_stories(
            project=f.build_project(),
            target_status_slug="non-existing",
            workflow=f.build_workflow(),
            stories_refs=[13, 54, 2],
            reorder={"place": "after", "ref": 3},
        )


async def test_reorder_story_story_ref_does_not_exist():
    with (
        patch("taiga.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        patch("taiga.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        pytest.raises(ex.InvalidStoryRefError),
    ):
        target_status = f.build_workflow_status()
        fake_workflows_repo.get_status.return_value = target_status

        fake_stories_repo.get_story.side_effect = Story.DoesNotExist

        await services.reorder_stories(
            project=f.build_project(),
            target_status_slug=target_status.slug,
            workflow=f.build_workflow(),
            stories_refs=[13, 54, 2],
            reorder={"place": "after", "ref": 3},
        )


async def test_reorder_story_not_all_stories_exist():
    with (
        patch("taiga.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        patch("taiga.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
        pytest.raises(ex.InvalidStoryRefError),
    ):
        target_status = f.build_workflow_status()
        fake_workflows_repo.get_status.return_value = target_status

        reorder_story = f.build_story(ref=3)
        fake_stories_repo.get_story.return_value = reorder_story
        fake_stories_repo.get_stories.return_value = [f.build_story]

        await services.reorder_stories(
            project=f.build_project(),
            target_status_slug=target_status.slug,
            workflow=f.build_workflow(),
            stories_refs=[13, 54, 2],
            reorder={"place": "after", "ref": reorder_story.ref},
        )


#######################################################
# get story
#######################################################


async def test_get_story_ok():
    story1 = f.build_story(ref=1)
    story2 = f.build_story(ref=2, project=story1.project, workflow=story1.workflow, status=story1.status)
    story3 = f.build_story(ref=3, project=story1.project, workflow=story1.workflow, status=story1.status)
    story_with_neighbors = {
        "ref": story2.ref,
        "title": story2.title,
        "status": story2.status,
        "prev": story1,
        "next": story3,
    }

    with patch("taiga.stories.services.stories_repositories", autospec=True) as fake_stories_repo:
        fake_stories_repo.get_story_with_neighbors_as_dict.return_value = story_with_neighbors
        story_ret = await services.get_story(project=story2.project, ref=story2.ref)

        fake_stories_repo.get_story_with_neighbors_as_dict.assert_awaited_once_with(
            project_id=story2.project.id, ref=story2.ref
        )
        assert story_ret["ref"] == story2.ref
        assert story_ret["prev"] == story1.ref
        assert story_ret["next"] == story3.ref


async def test_get_story_no_neighbors():
    story = f.build_story(ref=1)
    story_no_prev_neighbor = {
        "ref": story.ref,
        "title": story.title,
        "status": story.status,
        "prev": None,
        "next": None,
    }

    with patch("taiga.stories.services.stories_repositories", autospec=True) as fake_stories_repo:
        fake_stories_repo.get_story_with_neighbors_as_dict.return_value = story_no_prev_neighbor

        story_ret = await services.get_story(project=story.project, ref=story.ref)

        fake_stories_repo.get_story_with_neighbors_as_dict.assert_awaited_once_with(
            project_id=story.project.id, ref=story.ref
        )
        assert story_ret["ref"] == story.ref
        assert story_ret["prev"] is None
        assert story_ret["next"] is None


async def test_get_story_no_story():
    story = f.build_story(ref=1)
    no_story = None

    with patch("taiga.stories.services.stories_repositories", autospec=True) as fake_stories_repo:
        fake_stories_repo.get_story_with_neighbors_as_dict.return_value = no_story

        story_ret = await services.get_story(project=story.project, ref=story.ref)

        fake_stories_repo.get_story_with_neighbors_as_dict.assert_awaited_once_with(
            project_id=story.project.id, ref=story.ref
        )
        assert story_ret is None


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
