# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
from typing import Any

from pydantic import EmailStr, validator
from taiga.base.serializers import BaseModel
from taiga.invitations.choices import InvitationStatus
from taiga.projects.serializers.related import ProjectSmallSummarySerializer
from taiga.roles.serializers import BaseRoleSerializer
from taiga.users.serializers import UserSerializer


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


class PrivateEmailInvitationSerializer(BaseModel):
    user: UserSerializer | None
    role: BaseRoleSerializer
    email: EmailStr | None

    class Config:
        orm_mode = True

    @validator("email")
    def avoid_to_publish_email_if_user(cls, email: str, values: dict[str, Any]) -> str | None:
        user = values.get("user")
        if user:
            return None
        else:
            return email


class CreateInvitationsSerializer(BaseModel):
    invitations: list[PrivateEmailInvitationSerializer]
    already_members: int

    class Config:
        orm_mode = True
