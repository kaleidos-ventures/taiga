# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.events import events_manager
from taiga.users.models import User

DELETE_USER = "users.delete"


async def emit_event_when_user_is_deleted(user: User) -> None:
    await events_manager.publish_on_user_channel(
        user=user,
        type=DELETE_USER,
    )
