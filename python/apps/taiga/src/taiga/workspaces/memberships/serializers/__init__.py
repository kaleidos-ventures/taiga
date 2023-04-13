# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.serializers import BaseModel
from taiga.projects.projects.serializers.nested import ProjectNestedSerializer
from taiga.users.serializers.nested import UserNestedSerializer
from taiga.workspaces.workspaces.serializers.nested import WorkspaceSmallNestedSerializer


class WorkspaceMembershipDeletedSerializer(BaseModel):
    user: UserNestedSerializer
    workspace: WorkspaceSmallNestedSerializer

    class Config:
        orm_mode = True


class WorkspaceMembershipDetailSerializer(BaseModel):
    user: UserNestedSerializer
    workspace: WorkspaceSmallNestedSerializer
    projects: list[ProjectNestedSerializer]

    class Config:
        orm_mode = True


class WorkspaceGuestDetailSerializer(BaseModel):
    user: UserNestedSerializer
    projects: list[ProjectNestedSerializer]

    class Config:
        orm_mode = True
