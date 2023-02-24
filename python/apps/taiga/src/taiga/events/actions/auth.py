# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import TYPE_CHECKING, Literal

from taiga.events import channels
from taiga.events.responses import ActionResponse

from .base import Action

if TYPE_CHECKING:
    from taiga.events.subscriber import Subscriber


__all__ = ["SignInAction", "SignOutAction"]


class SignInAction(Action, type="signin"):
    command: Literal["signin"] = "signin"
    token: str

    async def run(self, subscriber: "Subscriber") -> None:
        if await subscriber.signin(token=self.token):
            channel = channels.user_channel(subscriber.user)
            await subscriber.subscribe(channel=channel)
            await subscriber.put(ActionResponse(action=self, content={"channel": channel}))
        else:
            await subscriber.put(ActionResponse(action=self, status="error", content={"detail": "invalid-credentials"}))


class SignOutAction(Action, type="signout"):
    command: Literal["signout"] = "signout"

    async def run(self, subscriber: "Subscriber") -> None:
        if subscriber.user.is_authenticated:
            channel = channels.user_channel(subscriber.user)
            await subscriber.unsubscribe(channel=channel)
            await subscriber.signout()
            await subscriber.put(ActionResponse(action=self))
        else:
            await subscriber.put(ActionResponse(action=self, status="error", content={"detail": "not-signed-in"}))
