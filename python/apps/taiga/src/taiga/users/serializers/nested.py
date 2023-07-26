# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.serializers import UUIDB64, BaseModel
from taiga.projects.projects.serializers.mixins import ProjectLogoMixin
from taiga.projects.projects.serializers.nested import ProjectNestedSerializer
from taiga.workspaces.workspaces.serializers.nested import WorkspaceSmallNestedSerializer


class UserNestedSerializer(BaseModel):
    username: str
    full_name: str
    color: int

    class Config:
        orm_mode = True


class _WorkspaceWithProjectsNestedSerializer(BaseModel):
    id: UUIDB64
    name: str
    slug: str
    color: int
    projects: list[ProjectNestedSerializer]

    class Config:
        orm_mode = True


class _ProjectWithWorkspaceNestedSerializer(BaseModel, ProjectLogoMixin):
    id: UUIDB64
    name: str
    slug: str
    description: str | None = None
    color: int | None = None
    workspace: WorkspaceSmallNestedSerializer

    class Config:
        orm_mode = True
