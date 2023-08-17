# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any, Callable, Generator, Type
from uuid import UUID

from taiga.base.utils.uuid import decode_b64str_to_uuid

CallableGenerator = Generator[Callable[..., Any], None, None]


class B64UUID(UUID):
    @classmethod
    def __modify_schema__(cls: Type["B64UUID"], field_schema: dict[str, Any]) -> None:
        field_schema["example"] = "6JgsbGyoEe2VExhWgGrI2w"
        field_schema["format"] = None

    @classmethod
    def __get_validators__(cls: Type["B64UUID"]) -> CallableGenerator:
        yield cls.validate

    @classmethod
    def validate(cls: Type["B64UUID"], value: str) -> UUID:
        return decode_b64str_to_uuid(value)
