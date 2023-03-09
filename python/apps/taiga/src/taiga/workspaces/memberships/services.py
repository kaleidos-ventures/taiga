# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Final
from uuid import UUID

from taiga.workspaces.memberships import repositories as workspace_memberships_repositories

WS_ROLE_NAME_ADMIN: Final = "admin"
WS_ROLE_NAME_MEMBER: Final = "member"
WS_ROLE_NAME_GUEST: Final = "guest"
WS_ROLE_NAME_NONE: Final = "none"


##########################################################
# misc
##########################################################


async def get_user_is_admin(
    workspace_id: UUID,
    user_id: UUID | None,
) -> bool:
    if not user_id:
        return False

    ws_membership = await workspace_memberships_repositories.get_workspace_membership(
        filters={"workspace_id": workspace_id, "user_id": user_id},
        select_related=[],
    )
    if ws_membership:
        return ws_membership.is_admin
    else:
        return False
