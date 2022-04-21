# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any

from taiga.base.api.permissions import PermissionComponent
from taiga.invitations import services
from taiga.users.models import User


class IsAnInvitationForMe(PermissionComponent):
    async def is_authorized(self, user: User, obj: Any = None) -> bool:
        if not obj or user.is_anonymous:
            return False

        return await services.project_invitation_is_for_this_user(obj, user)
