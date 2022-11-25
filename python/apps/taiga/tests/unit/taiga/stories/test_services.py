# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from decimal import Decimal
from unittest.mock import patch

import pytest
from taiga.base.repositories.neighbors import Neighbor
from taiga.stories import services
from taiga.stories.services import exceptions as ex
from taiga.workflows.schemas import WorkflowSchema
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


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
        fake_stories_repo.get_stories.return_value = None

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
            order=Decimal(100),
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
# get story
#######################################################


async def test_get_detailed_story_ok():
    story1 = f.build_story(ref=1)
    story2 = f.build_story(ref=2, project=story1.project, workflow=story1.workflow, status=story1.status)
    story3 = f.build_story(ref=3, project=story1.project, workflow=story1.workflow, status=story1.status)
    neighbors = Neighbor(prev=story1, next=story3)

    with patch("taiga.stories.services.stories_repositories", autospec=True) as fake_stories_repo:
        fake_stories_repo.get_story.return_value = story2
        fake_stories_repo.get_story_neighbors.return_value = neighbors

        story = await services.get_detailed_story(project_id=story2.project_id, ref=story2.ref)

        fake_stories_repo.get_story.assert_awaited_once_with(
            filters={"ref": story2.ref, "project_id": story2.project_id},
            select_related=["created_by", "project", "workflow", "status", "workspace"],
        )

        fake_stories_repo.get_story_neighbors.assert_awaited_once_with(
            story=story2, filters={"workflow_id": story2.workflow_id}
        )

        assert story["ref"] == story2.ref
        assert story["prev"] == story1
        assert story["next"] == story3


async def test_get_detailed_story_no_neighbors():
    story1 = f.build_story(ref=1)
    neighbors = Neighbor(prev=None, next=None)

    with patch("taiga.stories.services.stories_repositories", autospec=True) as fake_stories_repo:
        fake_stories_repo.get_story.return_value = story1
        fake_stories_repo.get_story_neighbors.return_value = neighbors

        story = await services.get_detailed_story(project_id=story1.project_id, ref=story1.ref)

        fake_stories_repo.get_story.assert_awaited_once_with(
            filters={"ref": story1.ref, "project_id": story1.project_id},
            select_related=["created_by", "project", "workflow", "status", "workspace"],
        )

        fake_stories_repo.get_story_neighbors.assert_awaited_once_with(
            story=story1, filters={"workflow_id": story1.workflow_id}
        )

        assert story["ref"] == story1.ref
        assert story["prev"] is None
        assert story["next"] is None


async def test_get_detailed_story_no_story():
    project = f.build_project()

    with patch("taiga.stories.services.stories_repositories", autospec=True) as fake_stories_repo:
        fake_stories_repo.get_story.return_value = None

        story = await services.get_detailed_story(project_id=project.id, ref=42)

        fake_stories_repo.get_story.assert_awaited_once_with(
            filters={"ref": 42, "project_id": project.id},
            select_related=["created_by", "project", "workflow", "status", "workspace"],
        )
        fake_stories_repo.get_story_neighbors.assert_not_awaited()

        assert story is None


#######################################################
# get_paginated_stories_by_workflow
#######################################################


async def test_get_paginated_stories_by_workflow():
    story = f.build_story()

    with (patch("taiga.stories.services.stories_repositories", autospec=True) as fake_stories_repo,):
        fake_stories_repo.get_total_stories.return_value = 1
        fake_stories_repo.get_stories.return_value = [story]

        await services.get_paginated_stories_by_workflow(
            project_id=story.project.id, workflow_slug=story.workflow.slug, offset=0, limit=10
        )
        fake_stories_repo.get_total_stories.assert_awaited_once_with(
            filters={"project_id": story.project.id, "workflow_slug": story.workflow.slug}
        )
        fake_stories_repo.get_stories.assert_awaited_once_with(
            offset=0,
            limit=10,
            select_related=["created_by", "project", "workflow", "status"],
            filters={"project_id": story.project.id, "workflow_slug": story.workflow.slug},
        )


#######################################################
# _calculate_offset
#######################################################


async def test_calculate_offset() -> None:
    target_status = f.build_workflow_status()
    with (patch("taiga.stories.services.stories_repositories", autospec=True) as fake_stories_repo,):
        # No reorder
        latest_story = f.build_story(status=target_status, order=36)
        fake_stories_repo.get_stories.return_value = [latest_story]
        offset, pre_order = await services._calculate_offset(total_stories_to_reorder=1, target_status=target_status)
        assert pre_order == latest_story.order
        assert offset == Decimal(100)

        fake_stories_repo.get_stories.return_value = None
        offset, pre_order = await services._calculate_offset(total_stories_to_reorder=1, target_status=target_status)
        assert pre_order == Decimal(0)
        assert offset == Decimal(100)

        # reorder_story
        reord_st = f.build_story(status=target_status, order=250)
        next_st = f.build_story(status=target_status, order=300)
        prev_st = f.build_story(status=target_status, order=150)

        # after
        fake_stories_repo.get_story_neighbors.return_value = Neighbor(next=next_st, prev=None)
        offset, pre_order = await services._calculate_offset(
            total_stories_to_reorder=1, target_status=target_status, reorder_story=reord_st, reorder_place="after"
        )
        assert pre_order == reord_st.order
        assert offset == Decimal(25)

        fake_stories_repo.get_story_neighbors.return_value = Neighbor(next=None, prev=None)
        offset, pre_order = await services._calculate_offset(
            total_stories_to_reorder=1, target_status=target_status, reorder_story=reord_st, reorder_place="after"
        )
        assert pre_order == reord_st.order
        assert offset == Decimal(100)

        # before
        fake_stories_repo.get_story_neighbors.return_value = Neighbor(next=None, prev=prev_st)
        offset, pre_order = await services._calculate_offset(
            total_stories_to_reorder=1, target_status=target_status, reorder_story=reord_st, reorder_place="before"
        )
        assert pre_order == prev_st.order
        assert offset == Decimal(50)

        fake_stories_repo.get_story_neighbors.return_value = Neighbor(next=None, prev=None)
        offset, pre_order = await services._calculate_offset(
            total_stories_to_reorder=1, target_status=target_status, reorder_story=reord_st, reorder_place="before"
        )
        assert pre_order == Decimal(0)
        assert offset == Decimal(125)


async def test_reorder_stories_ok():

    with (
        patch("taiga.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        patch("taiga.stories.services.stories_repositories", autospec=True) as fake_stories_repo,
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

        fake_stories_repo.bulk_update_stories.assert_awaited_once_with(
            objs_to_update=[s1, s2, s3], fields_to_update=["status", "order"]
        )
        fake_stories_events.emit_when_stories_are_reordered.assert_awaited_once()


async def test_reorder_story_workflowstatus_does_not_exist():
    with (
        patch("taiga.stories.services.workflows_repositories", autospec=True) as fake_workflows_repo,
        pytest.raises(ex.InvalidStatusError),
    ):
        fake_workflows_repo.get_status.return_value = None

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

        fake_stories_repo.get_story.return_value = None

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
# utils
#######################################################


def build_worklow_dt(story):
    return WorkflowSchema(
        id=story.workflow.id,
        name=story.workflow.name,
        slug=story.workflow.slug,
        order=story.workflow.order,
        statuses=[story.status],
    )
