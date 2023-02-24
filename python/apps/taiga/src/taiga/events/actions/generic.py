# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import TYPE_CHECKING, Literal

from taiga.events.responses import ActionResponse

from .base import Action

if TYPE_CHECKING:
    from taiga.events.subscriber import Subscriber


__all__ = ["PingAction"]


class PingAction(Action, type="ping"):
    command: Literal["ping"] = "ping"

    async def run(self, subscriber: "Subscriber") -> None:
        await subscriber.put(ActionResponse(action=self, content={"message": "pong"}))
