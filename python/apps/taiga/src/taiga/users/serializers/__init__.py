# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from pydantic import EmailStr
from taiga.auth.serializers import AccessTokenWithRefreshSerializer
from taiga.base.serializers import BaseModel
from taiga.projects.invitations.serializers.nested import ProjectInvitationNestedSerializer


class UserBaseSerializer(BaseModel):
    username: str
    full_name: str
    color: int
    # photo: str  # TODO
    # big_photo: str  # TODO
    # gravatar_id: str  # TODO


class UserSerializer(UserBaseSerializer):
    email: EmailStr
    lang: str

    class Config:
        orm_mode = True


class UserSearchSerializer(UserBaseSerializer):
    user_is_member: bool | None
    user_has_pending_invitation: bool | None

    class Config:
        orm_mode = True


class VerificationInfoSerializer(BaseModel):
    auth: AccessTokenWithRefreshSerializer
    project_invitation: ProjectInvitationNestedSerializer | None

    class Config:
        orm_mode = True
