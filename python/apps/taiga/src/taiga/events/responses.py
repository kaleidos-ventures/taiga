# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from abc import ABC
from typing import TYPE_CHECKING, Any, ClassVar, Final, Literal

from taiga.base.serializers import BaseModel
from taiga.events.events import Event

if TYPE_CHECKING:
    from pydantic.typing import CallableGenerator


#################################################
# General
#################################################


class Response(BaseModel, ABC):
    _types: ClassVar[dict[str, type]] = {}
    _discriminator: Final = "type"

    def __init_subclass__(cls, type: str | None = None):
        cls._types[type or cls.__name__.lower()] = cls

    @classmethod
    def __get_validators__(cls) -> "CallableGenerator":
        yield cls.validate

    @classmethod
    def validate(cls, value: dict[str, Any]) -> "Response":
        try:
            type = value[cls._discriminator]
            return cls._types[type](**value)
        except KeyError:
            raise ValueError(f"invalid '{cls._discriminator}' value")


class SystemResponse(Response, type="system"):
    type: Literal["system"] = "system"
    status: Literal["ok", "error"] = "ok"
    content: dict[str, Any] | None = None


class ActionResponse(Response, type="action"):
    type: Literal["action"] = "action"
    action: BaseModel
    status: Literal["ok", "error"] = "ok"
    content: dict[str, Any] | None = None


class EventResponse(Response, type="event"):
    type: Literal["event"] = "event"
    channel: str
    event: Event
