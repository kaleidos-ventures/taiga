# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from pydantic import EmailStr
from taiga.auth.serializers import AccessTokenWithRefreshSerializer
from taiga.base.serializers import UUIDB64, BaseModel
from taiga.projects.invitations.serializers.nested import ProjectInvitationNestedSerializer
from taiga.projects.projects.serializers.mixins import ProjectLogoMixin
from taiga.projects.projects.serializers.nested import ProjectNestedSerializer
from taiga.workspaces.invitations.serializers.nested import WorkspaceInvitationNestedSerializer
from taiga.workspaces.workspaces.serializers.nested import WorkspaceSmallNestedSerializer


class UserBaseSerializer(BaseModel):
    username: str
    full_name: str
    color: int


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
    workspace_invitation: WorkspaceInvitationNestedSerializer | None

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
    description: str
    color: int
    workspace: WorkspaceSmallNestedSerializer

    class Config:
        orm_mode = True


class UserDeleteInfoSerializer(BaseModel):
    workspaces: list[_WorkspaceWithProjectsNestedSerializer]
    projects: list[_ProjectWithWorkspaceNestedSerializer]

    class Config:
        orm_mode = True
