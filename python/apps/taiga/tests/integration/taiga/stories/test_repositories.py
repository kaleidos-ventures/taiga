# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
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
    )

    assert story.title == "test_create_story_ok"


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
