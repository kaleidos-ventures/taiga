# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.events.actions.projects import CheckProjectEventsSubscriptionAction

__all__ = [
    "emit_event_action_to_check_project_subscription",
]


async def emit_event_action_to_check_project_subscription(project_b64id: str) -> None:
    from taiga.events import events_manager

    await events_manager.publish_on_project_channel(
        project=project_b64id,
        type="action",
        content=CheckProjectEventsSubscriptionAction(project=project_b64id),
    )
