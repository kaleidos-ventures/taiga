# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.base.serializers import BaseModel
from taiga.projects.serializers.mixins import ProjectLogoMixin
from taiga.workspaces.serializers.related import WorkspaceSummarySerializer


class ProjectSummarySerializer(BaseModel, ProjectLogoMixin):
    name: str
    slug: str
    description: str | None = None
    color: int | None = None

    class Config:
        orm_mode = True


class ProjectSerializer(BaseModel, ProjectLogoMixin):
    name: str
    slug: str
    description: str | None = None
    color: int | None = None
    workspace: WorkspaceSummarySerializer

    # User related fields
    user_is_admin: bool
    user_is_member: bool
    user_has_pending_invitation: bool
    user_permissions: list[str]

    class Config:
        orm_mode = True
