# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from dataclasses import dataclass

from taiga.auth.dataclasses import AccessWithRefreshToken
from taiga.invitations.models import Invitation


@dataclass
class UserSearch:
    username: str
    full_name: str
    user_is_member: bool | None
    user_has_pending_invitation: bool | None


@dataclass
class VerificationInfo:
    auth: AccessWithRefreshToken
    project_invitation: Invitation | None
