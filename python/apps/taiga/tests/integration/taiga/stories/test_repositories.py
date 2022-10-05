# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from decimal import Decimal

import pytest
from asgiref.sync import sync_to_async
from taiga.stories import repositories
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# create_story
##########################################################


async def test_create_story_ok() -> None:
    user = await f.create_user()
    project = await f.create_simple_project()
    workflow = await f.create_workflow(project=project)
    status = await f.create_workflow_status(workflow=workflow)

    story = await repositories.create_story(
        title="test_create_story_ok",
        project_id=project.id,
        workflow_id=workflow.id,
        status_id=status.id,
        user_id=user.id,
        order=100,
    )

    assert story.title == "test_create_story_ok"


##########################################################
# get_story
##########################################################


async def test_get_story() -> None:
    story1 = await f.create_story()
    story = await repositories.get_story(project_id=story1.project.id, workflow_id=story1.workflow.id, ref=story1.ref)
    assert story1.ref == story.ref
    assert story1.title == story.title
    assert story1.id == story.id


##########################################################
# get_total_stories
##########################################################


async def test_get_total_stories() -> None:
    admin = await f.create_user()
    project = await f.create_project(owner=admin)
    workflow_1 = await sync_to_async(project.workflows.first)()
    status_1 = await sync_to_async(workflow_1.statuses.first)()
    workflow_2 = await f.create_workflow(project=project)
    status_2 = await sync_to_async(workflow_2.statuses.first)()

    await f.create_story(project=project, workflow=workflow_1, status=status_1)
    await f.create_story(project=project, workflow=workflow_1, status=status_1)
    await f.create_story(project=project, workflow=workflow_2, status=status_2)

    total_stories = await repositories.get_total_stories(project_id=project.id)
    assert total_stories == 3
    total_stories = await repositories.get_total_stories(project_id=project.id, workflow_id=workflow_1.id)
    assert total_stories == 2
    total_stories = await repositories.get_total_stories(project_id=project.id, workflow_id=workflow_2.id)
    assert total_stories == 1


##########################################################
# get_stories
##########################################################


async def test_get_stories() -> None:
    admin = await f.create_user()
    project = await f.create_project(owner=admin)
    workflow_1 = await sync_to_async(project.workflows.first)()
    status_1 = await sync_to_async(workflow_1.statuses.first)()
    workflow_2 = await f.create_workflow(project=project)
    status_2 = await sync_to_async(workflow_2.statuses.first)()

    story1 = await f.create_story(project=project, workflow=workflow_1, status=status_1)
    await f.create_story(project=project, workflow=workflow_1, status=status_1)
    await f.create_story(project=project, workflow=workflow_2, status=status_2)

    stories = await repositories.get_stories(project_id=project.id)
    assert len(stories) == 3
    assert stories[0].title and stories[0].ref and stories[0].status
    stories = await repositories.get_stories(workflow_id=workflow_1.id)
    assert len(stories) == 2
    stories = await repositories.get_stories(workflow_id=workflow_2.id)
    assert len(stories) == 1
    stories = await repositories.get_stories(workflow_id=workflow_1.id, refs=[story1.ref])
    assert len(stories) == 1


##########################################################
# get_stories_to_reorder
##########################################################


async def test_get_stories_to_reorder() -> None:
    admin = await f.create_user()
    project = await f.create_project(owner=admin)
    workflow = await sync_to_async(project.workflows.first)()
    status = await sync_to_async(workflow.statuses.first)()

    story1 = await f.create_story(project=project, workflow=workflow, status=status)
    story2 = await f.create_story(project=project, workflow=workflow, status=status)
    story3 = await f.create_story(project=project, workflow=workflow, status=status)

    stories = await repositories.get_stories_to_reorder(status_id=status.id, refs=[story1.ref, story2.ref, story3.ref])
    assert stories[0].ref == story1.ref
    assert stories[1].ref == story2.ref
    assert stories[2].ref == story3.ref

    stories = await repositories.get_stories_to_reorder(status_id=status.id, refs=[story1.ref, story3.ref, story2.ref])
    assert stories[0].ref == story1.ref
    assert stories[1].ref == story3.ref
    assert stories[2].ref == story2.ref

    stories = await repositories.get_stories_to_reorder(status_id=status.id, refs=[story3.ref, story1.ref, story2.ref])
    assert stories[0].ref == story3.ref
    assert stories[1].ref == story1.ref
    assert stories[2].ref == story2.ref


##########################################################
# get_stories_by_workflow
##########################################################


async def test_get_stories_by_workflow_ok() -> None:
    story1 = await f.create_story()
    story2 = await (
        f.create_story(
            project=story1.project, workflow=story1.workflow, status=story1.status, created_by=story1.project.owner
        )
    )
    total_stories = await repositories.get_total_stories_by_workflow(
        project_slug=story1.project.slug, workflow_slug=story1.workflow.slug
    )
    both_stories = await repositories.get_stories_by_workflow(
        project_slug=story1.project.slug, workflow_slug=story1.workflow.slug
    )

    assert total_stories == 2
    assert story1 in both_stories
    assert story2 in both_stories

    paginated_stories = await repositories.get_stories_by_workflow(
        project_slug=story1.project.slug, workflow_slug=story1.workflow.slug, offset=1, limit=1
    )

    assert story1 not in paginated_stories
    assert story2 in paginated_stories


##########################################################
# reorder_stories
##########################################################


async def test_not_reorder_in_empty_status() -> None:
    admin = await f.create_user()
    project = await f.create_project(owner=admin)
    workflow = await sync_to_async(project.workflows.first)()
    status_1 = await sync_to_async(workflow.statuses.first)()
    status_2 = await sync_to_async(workflow.statuses.last)()

    story1 = await f.create_story(project=project, workflow=workflow, status=status_1)
    story2 = await f.create_story(project=project, workflow=workflow, status=status_1)
    story3 = await f.create_story(project=project, workflow=workflow, status=status_1)
    # Current state
    # | status_1 | status_2 |
    # | -------- | -------- |
    # | story1   |          |
    # | story2   |          |
    # | story3   |          |

    target_status = status_2
    stories_to_reorder = [story2, story3]
    await repositories.reorder_stories(target_status=target_status, stories_to_reorder=stories_to_reorder)
    # Now should be
    # | status_1 | status_2 |
    # | -------- | -------- |
    # | story1   | story2   |
    # |          | story3   |
    stories = await repositories.get_stories(status_id=status_1.id)
    assert stories[0].ref == story1.ref
    stories = await repositories.get_stories(status_id=status_2.id)
    assert stories[0].ref == story2.ref
    assert stories[0].order == Decimal(100)
    assert stories[1].ref == story3.ref
    assert stories[1].order == Decimal(200)


async def test_not_reorder_in_populated_status() -> None:
    admin = await f.create_user()
    project = await f.create_project(owner=admin)
    workflow = await sync_to_async(project.workflows.first)()
    status_1 = await sync_to_async(workflow.statuses.first)()
    status_2 = await sync_to_async(workflow.statuses.last)()

    story1 = await f.create_story(project=project, workflow=workflow, status=status_1)
    story2 = await f.create_story(project=project, workflow=workflow, status=status_1)
    story3 = await f.create_story(project=project, workflow=workflow, status=status_2)
    # Current state
    # | status_1 | status_2 |
    # | -------- | -------- |
    # | story1   | story3   |
    # | story2   |          |

    target_status = status_2
    stories_to_reorder = [story2]
    await repositories.reorder_stories(target_status=target_status, stories_to_reorder=stories_to_reorder)
    # Now should be
    # | status_1 | status_2 |
    # | -------- | -------- |
    # | story1   | story3   |
    # |          | story2   |
    stories = await repositories.get_stories(status_id=status_1.id)
    assert stories[0].ref == story1.ref
    stories = await repositories.get_stories(status_id=status_2.id)
    assert stories[0].ref == story3.ref
    assert stories[1].ref == story2.ref
    assert stories[1].order == story3.order + 100


async def test_after_in_the_end() -> None:
    admin = await f.create_user()
    project = await f.create_project(owner=admin)
    workflow = await sync_to_async(project.workflows.first)()
    status_1 = await sync_to_async(workflow.statuses.first)()
    status_2 = await sync_to_async(workflow.statuses.last)()

    story1 = await f.create_story(project=project, workflow=workflow, status=status_1)
    story2 = await f.create_story(project=project, workflow=workflow, status=status_1)
    story3 = await f.create_story(project=project, workflow=workflow, status=status_2)
    # Current state
    # | status_1 | status_2 |
    # | -------- | -------- |
    # | story1   | story3   |
    # | story2   |          |

    target_status = status_2
    stories_to_reorder = [story2]
    reorder_place = "after"
    reorder_story = story3
    await repositories.reorder_stories(
        target_status=target_status,
        stories_to_reorder=stories_to_reorder,
        reorder_story=reorder_story,
        reorder_place=reorder_place,
    )
    # Now should be
    # | status_1 | status_2 |
    # | -------- | -------- |
    # | story1   | story3   |
    # |          | story2   |
    stories = await repositories.get_stories(status_id=status_1.id)
    assert stories[0].ref == story1.ref
    stories = await repositories.get_stories(status_id=status_2.id)
    assert stories[0].ref == story3.ref
    assert stories[1].ref == story2.ref
    assert stories[1].order == story3.order + 100


async def test_after_in_the_middle() -> None:
    admin = await f.create_user()
    project = await f.create_project(owner=admin)
    workflow = await sync_to_async(project.workflows.first)()
    status_1 = await sync_to_async(workflow.statuses.first)()
    status_2 = await sync_to_async(workflow.statuses.last)()

    story1 = await f.create_story(project=project, workflow=workflow, status=status_1)
    story2 = await f.create_story(project=project, workflow=workflow, status=status_2)
    story3 = await f.create_story(project=project, workflow=workflow, status=status_2)
    # Current state
    # | status_1 | status_2 |
    # | -------- | -------- |
    # | story1   | story2   |
    # |          | story3   |

    target_status = status_2
    stories_to_reorder = [story1]
    reorder_place = "after"
    reorder_story = story2
    await repositories.reorder_stories(
        target_status=target_status,
        stories_to_reorder=stories_to_reorder,
        reorder_story=reorder_story,
        reorder_place=reorder_place,
    )
    # Now should be
    # | status_1 | status_2 |
    # | -------- | -------- |
    # |          | story2   |
    # |          | story1   |
    # |          | story3   |
    stories = await repositories.get_stories(status_id=status_1.id)
    assert len(stories) == 0
    stories = await repositories.get_stories(status_id=status_2.id)
    assert stories[0].ref == story2.ref
    assert stories[1].ref == story1.ref
    assert stories[1].order == story2.order + ((story3.order - story2.order) / 2)
    assert stories[2].ref == story3.ref


async def test_before_in_the_beginning() -> None:
    admin = await f.create_user()
    project = await f.create_project(owner=admin)
    workflow = await sync_to_async(project.workflows.first)()
    status_1 = await sync_to_async(workflow.statuses.first)()
    status_2 = await sync_to_async(workflow.statuses.last)()

    story1 = await f.create_story(project=project, workflow=workflow, status=status_1)
    story2 = await f.create_story(project=project, workflow=workflow, status=status_2)
    story3 = await f.create_story(project=project, workflow=workflow, status=status_2)
    # Current state
    # | status_1 | status_2 |
    # | -------- | -------- |
    # | story1   | story2   |
    # |          | story3   |

    target_status = status_2
    stories_to_reorder = [story1]
    reorder_place = "before"
    reorder_story = story2
    await repositories.reorder_stories(
        target_status=target_status,
        stories_to_reorder=stories_to_reorder,
        reorder_story=reorder_story,
        reorder_place=reorder_place,
    )
    # Now should be
    # | status_1 | status_2 |
    # | -------- | -------- |
    # |          | story1   |
    # |          | story2   |
    # |          | story3   |
    stories = await repositories.get_stories(status_id=status_1.id)
    assert len(stories) == 0
    stories = await repositories.get_stories(status_id=status_2.id)
    assert stories[0].ref == story1.ref
    assert stories[0].order == story2.order / 2
    assert stories[1].ref == story2.ref
    assert stories[2].ref == story3.ref


async def test_before_in_the_middle() -> None:
    admin = await f.create_user()
    project = await f.create_project(owner=admin)
    workflow = await sync_to_async(project.workflows.first)()
    status_1 = await sync_to_async(workflow.statuses.first)()
    status_2 = await sync_to_async(workflow.statuses.last)()

    story1 = await f.create_story(project=project, workflow=workflow, status=status_1)
    story2 = await f.create_story(project=project, workflow=workflow, status=status_2)
    story3 = await f.create_story(project=project, workflow=workflow, status=status_2)
    # Current state
    # | status_1 | status_2 |
    # | -------- | -------- |
    # | story1   | story2   |
    # |          | story3   |

    target_status = status_2
    stories_to_reorder = [story1]
    reorder_place = "before"
    reorder_story = story3
    await repositories.reorder_stories(
        target_status=target_status,
        stories_to_reorder=stories_to_reorder,
        reorder_story=reorder_story,
        reorder_place=reorder_place,
    )
    # Now should be
    # | status_1 | status_2 |
    # | -------- | -------- |
    # |          | story2   |
    # |          | story1   |
    # |          | story3   |
    stories = await repositories.get_stories(status_id=status_1.id)
    assert len(stories) == 0
    stories = await repositories.get_stories(status_id=status_2.id)
    assert stories[0].ref == story2.ref
    assert stories[1].ref == story1.ref
    assert stories[1].order == story2.order + ((story3.order - story2.order) / 2)
    assert stories[2].ref == story3.ref


##########################################################
# get_max_order
##########################################################


async def test_get_max_order() -> None:
    admin = await f.create_user()
    project = await f.create_project(owner=admin)

    workflow_1 = await sync_to_async(project.workflows.first)()
    status_11 = await sync_to_async(workflow_1.statuses.first)()
    status_12 = await sync_to_async(workflow_1.statuses.last)()

    workflow_2 = await f.create_workflow(project=project)
    await sync_to_async(workflow_2.statuses.first)()
    status_22 = await sync_to_async(workflow_2.statuses.last)()

    await f.create_story(project=project, workflow=workflow_1, status=status_11, order=10)
    await f.create_story(project=project, workflow=workflow_1, status=status_11, order=11)
    await f.create_story(project=project, workflow=workflow_1, status=status_11, order=12)

    max_order = await repositories.get_max_order(workflow_id=workflow_1.id)
    assert max_order == 12

    await f.create_story(project=project, workflow=workflow_1, status=status_12, order=100)
    await f.create_story(project=project, workflow=workflow_1, status=status_12, order=110)
    await f.create_story(project=project, workflow=workflow_1, status=status_12, order=120)

    max_order = await repositories.get_max_order(status_id=status_11.id)
    assert max_order == 12
    max_order = await repositories.get_max_order(workflow_id=workflow_1.id)
    assert max_order == 120

    await f.create_story(project=project, workflow=workflow_2, status=status_22, order=90)
    await f.create_story(project=project, workflow=workflow_2, status=status_22, order=10)
    await f.create_story(project=project, workflow=workflow_2, status=status_22, order=20)

    max_order = await repositories.get_max_order(project_id=project.id)
    assert max_order == 120
    max_order = await repositories.get_max_order(workflow_id=workflow_2.id)
    assert max_order == 90
