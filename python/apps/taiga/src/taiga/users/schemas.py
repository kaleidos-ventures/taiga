# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from dataclasses import dataclass

from taiga.auth.schemas import AccessWithRefreshTokenSchema
from taiga.projects.invitations.models import ProjectInvitation


@dataclass
class VerificationInfoSchema:
    auth: AccessWithRefreshTokenSchema
    project_invitation: ProjectInvitation | None


@dataclass
class UserBaseSchema:
    username: str
    full_name: str | None
    color: int
