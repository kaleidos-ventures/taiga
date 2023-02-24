# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from abc import ABC
from typing import TYPE_CHECKING, Any, ClassVar, Final

from pydantic import parse_obj_as, parse_raw_as
from taiga.base.serializers import BaseModel

if TYPE_CHECKING:
    from pydantic.typing import CallableGenerator
    from taiga.events.subscriber import Subscriber


__all__ = [
    "Action",
    "parse_action_from_text",
    "parse_action_from_obj",
]


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


def parse_action_from_text(text: str) -> Action:
    return parse_raw_as(Action, text)


def parse_action_from_obj(obj: Any) -> Action:
    return parse_obj_as(Action, obj)
