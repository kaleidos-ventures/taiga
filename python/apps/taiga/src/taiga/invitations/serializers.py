# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from pydantic import EmailStr
from taiga.base.serializer import BaseModel
from taiga.roles.serializers import BaseRoleSerializer
from taiga.users.serializers import UserSerializer
from taiga.invitations.choices import InvitationStatus
from taiga.projects.serializers.related import ProjectSmallSummarySerializer


class PublicInvitationSerializer(BaseModel):
    status: InvitationStatus
    email: EmailStr
    existing_user: bool
    project: ProjectSmallSummarySerializer

    class Config:
        orm_mode = True


class InvitationSerializer(BaseModel):
    user: UserSerializer | None
    role: BaseRoleSerializer
    email: EmailStr

    class Config:
        orm_mode = True
