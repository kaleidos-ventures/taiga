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
# create_workflow
##########################################################


async def test_create_workflow():
    project = await f.create_project()
    workflow_res = await repositories.create_workflow(
        name="workflow",
        slug="slug",
        order=1,
        project=project,
    )
    assert workflow_res.name == "workflow"
    assert workflow_res.project == project


##########################################################
# create_workflow_status
##########################################################


async def test_create_workflow_status():
    workflow = await f.create_workflow()

    workflow_status_res = await repositories.create_workflow_status(
        name="workflow-status",
        slug="slug",
        color=1,
        order=1,
        workflow=workflow,
    )
    assert workflow_status_res.name == "workflow-status"
    assert workflow_status_res.workflow == workflow


##########################################################
# get_workflows
##########################################################


async def test_get_workflows_ok() -> None:
    project = await f.create_project()

    workflows = await repositories.get_workflows(filters={"project_id": project.id})

    assert len(workflows) == 1
    assert len(workflows[0].statuses) == 4
    assert hasattr(workflows[0], "id")


async def test_get_project_without_workflows_ok() -> None:
    project = await f.create_simple_project()
    workflows = await repositories.get_workflows(filters={"project_id": project.id})

    assert len(workflows) == 0


##########################################################
# get_workflow
##########################################################


async def test_get_workflow_ok() -> None:
    project = await f.create_project()
    workflows = await _get_workflows(project=project)
    workflow = await repositories.get_workflow(filters={"project_id": project.id, "slug": workflows[0].slug})
    assert workflow is not None
    assert hasattr(workflow, "id")


async def test_get_project_without_workflow_ok() -> None:
    project = await f.create_simple_project()
    workflow = await repositories.get_workflow(filters={"project_id": project.id, "slug": "not-existing-slug"})
    assert workflow is None


##########################################################
# utils
##########################################################


@sync_to_async
def _get_workflows(project: Project) -> list[Workflow]:
    return list(project.workflows.all())
