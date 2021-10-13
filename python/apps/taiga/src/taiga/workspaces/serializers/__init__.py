# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

# from typing import List

from taiga.base.serializer import BaseModel

# from taiga.projects.serializers.related import ProjectSummarySerializer


class WorkspaceSummarySerializer(BaseModel):
    name: str
    slug: str
    color: int
    # latest_projects: List[ProjectSummarySerializer]
    # total_projects: int

    class Config:
        orm_mode = True


class WorkspaceSerializer(BaseModel):
    name: str
    slug: str
    color: int

    class Config:
        orm_mode = True
