# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


from taiga.workflows import dataclasses as dt
from taiga.workflows import repositories as workflows_repositories


async def get_project_workflows(project_slug: str) -> list[dt.Workflow]:
    return await workflows_repositories.get_project_workflows(project_slug=project_slug)
