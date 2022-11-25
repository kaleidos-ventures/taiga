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
# get_project_workflows
#######################################################


async def test_get_project_workflows_ok():
    workflows = [f.build_workflow()]

    with (patch("taiga.workflows.services.workflows_repositories", autospec=True) as fake_workflows_repo):
        fake_workflows_repo.get_project_workflows.return_value = workflows
        await services.get_project_workflows(project_id="id")
        fake_workflows_repo.get_project_workflows.assert_awaited_once()
