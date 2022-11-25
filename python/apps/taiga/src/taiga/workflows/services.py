# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


from uuid import UUID

from taiga.workflows import repositories as workflows_repositories
from taiga.workflows.schemas import WorkflowSchema


async def get_project_workflows(project_id: UUID) -> list[WorkflowSchema]:
    return await workflows_repositories.get_project_workflows(filters={"project_id": project_id})


async def get_project_workflow(project_id: UUID, workflow_slug: str) -> WorkflowSchema | None:
    return await workflows_repositories.get_project_workflow(filters={"project_id": project_id, "slug": workflow_slug})
