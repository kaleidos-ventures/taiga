# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from abc import ABC
from typing import TYPE_CHECKING, Any, ClassVar, Final, Literal

from pydantic import parse_raw_as
from taiga.base.serializers import BaseModel
from taiga.events import channels

if TYPE_CHECKING:
    from pydantic.typing import CallableGenerator
    from taiga.events.subscriber import Subscriber


#################################################
# General
#################################################


class Action(BaseModel, ABC):
    _types: ClassVar[dict[str, type]] = {}
    _discriminator: Final = "command"

    def __init_subclass__(cls, type: str | None = None) -> None:
        cls._types[type or cls.__name__.lower()] = cls

    @classmethod
    def __get_validators__(cls) -> "CallableGenerator":
        yield cls.validate

    @classmethod
    def validate(cls, value: dict[str, Any]) -> "Action":
        try:
            type = value[cls._discriminator]
            return cls._types[type](**value)
        except KeyError:
            raise ValueError(f"invalid '{cls._discriminator}' value")

    async def run(self, subscriber: "Subscriber") -> None:
        raise NotImplementedError


#################################################
# PING
#################################################


class PingAction(Action, type="ping"):
    command: Literal["ping"] = "ping"

    async def run(self, subscriber: "Subscriber") -> None:
        from taiga.events.responses import ActionResponse

        await subscriber.put(ActionResponse(action=self, content={"message": "pong"}))


#################################################
# SIGN IN / SIGN OUT
#################################################

# To Me


class SignInAction(Action, type="signin"):
    command: Literal["signin"] = "signin"
    token: str

    async def run(self, subscriber: "Subscriber") -> None:
        from taiga.events.responses import ActionResponse

        if await subscriber.signin(token=self.token):
            channel = channels.user_channel(subscriber.user)
            await subscriber.subscribe(channel=channel)
            await subscriber.put(ActionResponse(action=self, content={"channel": channel}))
        else:
            await subscriber.put(ActionResponse(action=self, status="error", content={"detail": "invalid-credentials"}))


class SignOutAction(Action, type="signout"):
    command: Literal["signout"] = "signout"

    async def run(self, subscriber: "Subscriber") -> None:
        from taiga.events.responses import ActionResponse

        if subscriber.user.is_authenticated:
            channel = channels.user_channel(subscriber.user)
            await subscriber.unsubscribe(channel=channel)
            await subscriber.signout()
            await subscriber.put(ActionResponse(action=self))
        else:
            await subscriber.put(ActionResponse(action=self, status="error", content={"detail": "not-signed-in"}))


#################################################
# SUBSCRIBE / UNSUBSCRIBE
#################################################

# To Project


class SubscribeToProjectEventsAction(Action, type="subscribe_to_project_events"):
    command: Literal["subscribe_to_project_events"] = "subscribe_to_project_events"
    project: str

    async def run(self, subscriber: "Subscriber") -> None:
        from taiga.events.responses import ActionResponse

        if subscriber.user.is_authenticated:
            channel = channels.project_channel(self.project)
            content = {"channel": channel}
            await subscriber.subscribe(channel=channel)
            await subscriber.put(ActionResponse(action=self, content=content))
        else:
            await subscriber.put(ActionResponse(action=self, status="error", content={"detail": "not-allowed"}))


class UnsubscribeFromProjectEventsAction(Action, type="unsubscribe_from_project_events"):
    command: Literal["unsubscribe_from_project_events"] = "unsubscribe_from_project_events"
    project: str

    async def run(self, subscriber: "Subscriber") -> None:
        from taiga.events.responses import ActionResponse

        if subscriber.user.is_authenticated:
            channel = channels.project_channel(self.project)
            ok = await subscriber.unsubscribe(channel=channel)
            if ok:
                await subscriber.put(ActionResponse(action=self))
            else:
                await subscriber.put(ActionResponse(action=self, status="error", content={"detail": "not-subscribe"}))
        else:
            await subscriber.put(ActionResponse(action=self, status="error", content={"detail": "not-allowed"}))


def parse_action_from_text(text: str) -> Action:
    return parse_raw_as(Action, text)
