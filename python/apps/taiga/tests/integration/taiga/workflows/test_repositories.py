# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from asgiref.sync import sync_to_async
from taiga.projects.projects.models import Project
from taiga.workflows import repositories
from taiga.workflows.models import Workflow
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# get_project_workflows
##########################################################


async def test_get_project_workflows_ok() -> None:
    project = await f.create_project()

    workflows = await repositories.get_project_workflows(project_slug=project.slug)

    assert len(workflows) == 1
    assert len(workflows[0].statuses) == 4
    assert hasattr(workflows[0], "id")


async def test_get_project_without_workflows_ok() -> None:
    project = await f.create_simple_project()

    workflows = await repositories.get_project_workflows(project_slug=project.slug)

    assert len(workflows) == 0


##########################################################
# get_project_workflow
##########################################################


async def test_get_project_workflow_ok() -> None:
    project = await f.create_project()
    project_workflows = await _get_project_workflows(project=project)
    workflow = await repositories.get_project_workflow(
        project_slug=project.slug, workflow_slug=project_workflows[0].slug
    )

    assert workflow is not None
    assert hasattr(workflow, "id")


async def test_get_project_without_workflow_ok() -> None:
    project = await f.create_simple_project()
    workflow = await repositories.get_project_workflow(project_slug=project.slug, workflow_slug="not-existing-slug")

    assert workflow is None


##########################################################
# utils
##########################################################


@sync_to_async
def _get_project_workflows(project: Project) -> list[Workflow]:
    return list(project.workflows.all())
