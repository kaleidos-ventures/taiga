# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any

from taiga.base.api.permissions import PermissionComponent
from taiga.users.models import AnyUser


class IsProjectInvitationRecipient(PermissionComponent):
    async def is_authorized(self, user: AnyUser, obj: Any = None) -> bool:
        from taiga.projects.invitations import services as invitations_services

        if not obj or user.is_anonymous or not user.is_active:
            return False

        return invitations_services.is_project_invitation_for_this_user(invitation=obj, user=user)
