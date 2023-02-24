# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any, Callable, Generator
from uuid import UUID

from taiga.base.utils.uuid import encode_uuid_to_b64str

CallableGenerator = Generator[Callable[..., Any], None, None]


class UUIDB64(UUID):
    @classmethod
    def __modify_schema__(cls, field_schema: dict[str, Any]) -> None:
        field_schema["example"] = "6JgsbGyoEe2VExhWgGrI2w"

    @classmethod
    def __get_validators__(cls) -> CallableGenerator:
        yield cls.validate

    @classmethod
    def validate(cls, value: UUID) -> str:
        return encode_uuid_to_b64str(value)
