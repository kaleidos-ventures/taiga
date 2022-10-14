# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from pydantic import EmailStr
from taiga.auth.serializers import AccessTokenWithRefreshSerializer
from taiga.base.serializers import BaseModel
from taiga.projects.invitations.serializers.related import ProjectInvitationSummaryVerifyUserSerializer


class UserBaseSerializer(BaseModel):
    username: str
    full_name: str
    # photo: str  # TODO
    # big_photo: str  # TODO
    # gravatar_id: str  # TODO


class UserSerializer(UserBaseSerializer):
    lang: str

    class Config:
        orm_mode = True


class UserMeSerializer(UserBaseSerializer):
    email: EmailStr
    lang: str

    class Config:
        orm_mode = True


class UserSearchSerializer(UserBaseSerializer):
    user_is_member: bool | None
    user_has_pending_invitation: bool | None


class VerificationInfoSerializer(BaseModel):
    auth: AccessTokenWithRefreshSerializer
    project_invitation: ProjectInvitationSummaryVerifyUserSerializer | None

    class Config:
        orm_mode = True
