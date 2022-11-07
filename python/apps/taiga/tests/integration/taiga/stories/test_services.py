# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from decimal import Decimal

import pytest
from asgiref.sync import sync_to_async
from taiga.stories import repositories, services
from taiga.workflows import repositories as workflows_repositories
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# reorder_stories
##########################################################


async def test_not_reorder_in_empty_status() -> None:
    admin = await f.create_user()
    project = await f.create_project(owner=admin)
    workflow = await sync_to_async(project.workflows.first)()
    workflow_schema = await sync_to_async(workflows_repositories._get_workflow_dt)(workflow=workflow)
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

    await services.reorder_stories(
        project=project,
        workflow=workflow_schema,
        target_status_slug=status_2.slug,
        stories_refs=[story2.ref, story3.ref],
    )
    # Now should be
    # | status_1 | status_2 |
    # | -------- | -------- |
    # | story1   | story2   |
    # |          | story3   |
    stories = await repositories.get_stories(filters={"status_id": status_1.id})
    assert stories[0].ref == story1.ref
    stories = await repositories.get_stories(filters={"status_id": status_2.id})
    assert stories[0].ref == story2.ref
    assert stories[0].order == Decimal(100)
    assert stories[1].ref == story3.ref
    assert stories[1].order == Decimal(200)


async def test_not_reorder_in_populated_status() -> None:
    admin = await f.create_user()
    project = await f.create_project(owner=admin)
    workflow = await sync_to_async(project.workflows.first)()
    workflow_schema = await sync_to_async(workflows_repositories._get_workflow_dt)(workflow=workflow)
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

    await services.reorder_stories(
        project=project, workflow=workflow_schema, target_status_slug=status_2.slug, stories_refs=[story2.ref]
    )
    # Now should be
    # | status_1 | status_2 |
    # | -------- | -------- |
    # | story1   | story3   |
    # |          | story2   |
    stories = await repositories.get_stories(filters={"status_id": status_1.id})
    assert stories[0].ref == story1.ref
    stories = await repositories.get_stories(filters={"status_id": status_2.id})
    assert stories[0].ref == story3.ref
    assert stories[1].ref == story2.ref
    assert stories[1].order == story3.order + 100


async def test_after_in_the_end() -> None:
    admin = await f.create_user()
    project = await f.create_project(owner=admin)
    workflow = await sync_to_async(project.workflows.first)()
    workflow_schema = await sync_to_async(workflows_repositories._get_workflow_dt)(workflow=workflow)
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

    await services.reorder_stories(
        project=project,
        workflow=workflow_schema,
        target_status_slug=status_2.slug,
        stories_refs=[story2.ref],
        reorder={"place": "after", "ref": story3.ref},
    )
    # Now should be
    # | status_1 | status_2 |
    # | -------- | -------- |
    # | story1   | story3   |
    # |          | story2   |
    stories = await repositories.get_stories(filters={"status_id": status_1.id})
    assert stories[0].ref == story1.ref
    stories = await repositories.get_stories(filters={"status_id": status_2.id})
    assert stories[0].ref == story3.ref
    assert stories[1].ref == story2.ref
    assert stories[1].order == story3.order + 100


async def test_after_in_the_middle() -> None:
    admin = await f.create_user()
    project = await f.create_project(owner=admin)
    workflow = await sync_to_async(project.workflows.first)()
    workflow_schema = await sync_to_async(workflows_repositories._get_workflow_dt)(workflow=workflow)
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

    await services.reorder_stories(
        project=project,
        workflow=workflow_schema,
        target_status_slug=status_2.slug,
        stories_refs=[story1.ref],
        reorder={"place": "after", "ref": story2.ref},
    )
    # Now should be
    # | status_1 | status_2 |
    # | -------- | -------- |
    # |          | story2   |
    # |          | story1   |
    # |          | story3   |
    stories = await repositories.get_stories(filters={"status_id": status_1.id})
    assert len(stories) == 0
    stories = await repositories.get_stories(filters={"status_id": status_2.id})
    assert stories[0].ref == story2.ref
    assert stories[1].ref == story1.ref
    assert stories[1].order == story2.order + ((story3.order - story2.order) / 2)
    assert stories[2].ref == story3.ref


async def test_before_in_the_beginning() -> None:
    admin = await f.create_user()
    project = await f.create_project(owner=admin)
    workflow = await sync_to_async(project.workflows.first)()
    workflow_schema = await sync_to_async(workflows_repositories._get_workflow_dt)(workflow=workflow)
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

    await services.reorder_stories(
        project=project,
        workflow=workflow_schema,
        target_status_slug=status_2.slug,
        stories_refs=[story1.ref],
        reorder={"place": "before", "ref": story2.ref},
    )
    # Now should be
    # | status_1 | status_2 |
    # | -------- | -------- |
    # |          | story1   |
    # |          | story2   |
    # |          | story3   |
    stories = await repositories.get_stories(filters={"status_id": status_1.id})
    assert len(stories) == 0
    stories = await repositories.get_stories(filters={"status_id": status_2.id})
    assert stories[0].ref == story1.ref
    assert stories[0].order == story2.order / 2
    assert stories[1].ref == story2.ref
    assert stories[2].ref == story3.ref


async def test_before_in_the_middle() -> None:
    admin = await f.create_user()
    project = await f.create_project(owner=admin)
    workflow = await sync_to_async(project.workflows.first)()
    workflow_schema = await sync_to_async(workflows_repositories._get_workflow_dt)(workflow=workflow)
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

    await services.reorder_stories(
        project=project,
        workflow=workflow_schema,
        target_status_slug=status_2.slug,
        stories_refs=[story1.ref],
        reorder={"place": "before", "ref": story3.ref},
    )
    # Now should be
    # | status_1 | status_2 |
    # | -------- | -------- |
    # |          | story2   |
    # |          | story1   |
    # |          | story3   |
    stories = await repositories.get_stories(filters={"status_id": status_1.id})
    assert len(stories) == 0
    stories = await repositories.get_stories(filters={"status_id": status_2.id})
    assert stories[0].ref == story2.ref
    assert stories[1].ref == story1.ref
    assert stories[1].order == story2.order + ((story3.order - story2.order) / 2)
    assert stories[2].ref == story3.ref
