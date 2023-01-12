# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import patch

from taiga.workflows import services
from tests.utils import factories as f

#######################################################
# list_workflows
#######################################################


async def test_list_workflows_ok():
    workflows = [f.build_workflow()]

    with (patch("taiga.workflows.services.workflows_repositories", autospec=True) as fake_workflows_repo):
        fake_workflows_repo.list_workflows_schemas.return_value = workflows
        await services.list_workflows_schemas(project_id="id")
        fake_workflows_repo.list_workflows_schemas.assert_awaited_once_with(
            filters={"project_id": "id"},
            prefetch_related=["statuses"],
        )


#######################################################
# get_workflow
#######################################################


async def test_get_workflow_ok():
    workflow = f.build_workflow()

    with (patch("taiga.workflows.services.workflows_repositories", autospec=True) as fake_workflows_repo):
        fake_workflows_repo.get_workflow.return_value = workflow
        await services.get_workflow(project_id="id", workflow_slug="main")
        fake_workflows_repo.get_workflow.assert_awaited_once()
