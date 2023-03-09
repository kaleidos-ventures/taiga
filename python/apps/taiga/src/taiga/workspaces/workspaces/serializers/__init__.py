# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.serializers import UUIDB64, BaseModel
from taiga.projects.projects.serializers.nested import ProjectNestedSerializer


class WorkspaceDetailSerializer(BaseModel):
    id: UUIDB64
    name: str
    slug: str
    color: int
    latest_projects: list[ProjectNestedSerializer]
    invited_projects: list[ProjectNestedSerializer]
    total_projects: int
    has_projects: bool
    user_is_admin: bool

    class Config:
        orm_mode = True


class WorkspaceSerializer(BaseModel):
    id: UUIDB64
    name: str
    slug: str
    color: int
    total_projects: int
    has_projects: bool
    user_is_admin: str

    class Config:
        orm_mode = True
