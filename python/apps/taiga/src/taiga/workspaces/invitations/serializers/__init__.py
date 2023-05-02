# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from typing import Any
from uuid import UUID

from pydantic import EmailStr, validator
from taiga.base.serializers import BaseModel
from taiga.users.serializers.nested import UserNestedSerializer
from taiga.workspaces.invitations.choices import WorkspaceInvitationStatus
from taiga.workspaces.workspaces.serializers.nested import WorkspaceSmallNestedSerializer


class PrivateEmailWorkspaceInvitationSerializer(BaseModel):
    id: UUID
    user: UserNestedSerializer | None
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


class CreateWorkspaceInvitationsSerializer(BaseModel):
    invitations: list[PrivateEmailWorkspaceInvitationSerializer]
    already_members: int

    class Config:
        orm_mode = True


class PublicWorkspaceInvitationSerializer(BaseModel):
    status: WorkspaceInvitationStatus

    email: EmailStr
    existing_user: bool
    available_logins: list[str]
    workspace: WorkspaceSmallNestedSerializer

    class Config:
        orm_mode = True


class WorkspaceInvitationSerializer(BaseModel):
    id: UUID
    workspace: WorkspaceSmallNestedSerializer
    user: UserNestedSerializer | None
    email: EmailStr

    class Config:
        orm_mode = True
