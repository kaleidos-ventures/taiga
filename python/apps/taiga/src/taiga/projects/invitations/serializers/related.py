# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.base.serializers import BaseModel
from taiga.projects.invitations.choices import ProjectInvitationStatus
from taiga.projects.projects.serializers.nested import ProjectSmallNestedSerializer


class ProjectInvitationSummaryVerifyUserSerializer(BaseModel):
    status: ProjectInvitationStatus
    project: ProjectSmallNestedSerializer

    class Config:
        orm_mode = True
