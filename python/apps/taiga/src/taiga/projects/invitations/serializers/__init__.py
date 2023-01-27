# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
from typing import Any
from uuid import UUID

from pydantic import EmailStr, validator
from taiga.base.serializers import BaseModel
from taiga.projects.invitations.choices import ProjectInvitationStatus
from taiga.projects.projects.serializers.nested import ProjectSmallNestedSerializer
from taiga.projects.roles.serializers.nested import ProjectRoleNestedSerializer
from taiga.users.serializers.nested import UserNestedSerializer


class PublicProjectInvitationSerializer(BaseModel):
    status: ProjectInvitationStatus
    email: EmailStr
    existing_user: bool
    available_logins: list[str]
    project: ProjectSmallNestedSerializer

    class Config:
        orm_mode = True


class ProjectInvitationSerializer(BaseModel):
    id: UUID
    project: ProjectSmallNestedSerializer
    user: UserNestedSerializer | None
    role: ProjectRoleNestedSerializer
    email: EmailStr

    class Config:
        orm_mode = True


class PrivateEmailProjectInvitationSerializer(BaseModel):
    id: UUID
    user: UserNestedSerializer | None
    role: ProjectRoleNestedSerializer
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


class CreateProjectInvitationsSerializer(BaseModel):
    invitations: list[PrivateEmailProjectInvitationSerializer]
    already_members: int

    class Config:
        orm_mode = True
