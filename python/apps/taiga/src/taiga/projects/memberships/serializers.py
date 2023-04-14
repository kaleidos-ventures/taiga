# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.serializers import BaseModel
from taiga.projects.projects.serializers.nested import ProjectNestedSerializer
from taiga.projects.roles.serializers.nested import ProjectRoleNestedSerializer
from taiga.users.serializers.nested import UserNestedSerializer


class ProjectMembershipSerializer(BaseModel):
    user: UserNestedSerializer
    role: ProjectRoleNestedSerializer
    project: ProjectNestedSerializer

    class Config:
        orm_mode = True


class ProjectMembershipDeletedSerializer(BaseModel):
    user: UserNestedSerializer
    project: ProjectNestedSerializer

    class Config:
        orm_mode = True
