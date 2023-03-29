# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any, Callable, Generator
from uuid import UUID

from pydantic import AnyHttpUrl, AnyUrl, BaseConfig, ConstrainedStr
from pydantic.fields import ModelField
from taiga.base.i18n import i18n
from taiga.base.utils.uuid import decode_b64str_to_uuid
from taiga.conf import settings

CallableGenerator = Generator[Callable[..., Any], None, None]


class LanguageCode(str):
    @classmethod
    def __modify_schema__(cls, field_schema: dict[str, Any]) -> None:
        field_schema["example"] = settings.LANG
        field_schema["enum"] = i18n.available_languages

    @classmethod
    def __get_validators__(cls) -> CallableGenerator:
        yield cls.validate

    @classmethod
    def validate(cls, value: str) -> str:
        assert i18n.is_language_available(value), "Language is not available"
        return value


class StrNotEmpty(ConstrainedStr):
    strip_whitespace = True
    min_length = 1


class B64UUID(UUID):
    @classmethod
    def __modify_schema__(cls, field_schema: dict[str, Any]) -> None:
        field_schema["example"] = "6JgsbGyoEe2VExhWgGrI2w"
        field_schema["format"] = None

    @classmethod
    def __get_validators__(cls) -> CallableGenerator:
        yield cls.validate

    @classmethod
    def validate(cls, value: str) -> UUID | None:
        try:
            return decode_b64str_to_uuid(value)
        except ValueError:
            # if it's not a valid base64 string return None to force a 404 (Not Found) response
            return None


class FileField(AnyHttpUrl):
    @classmethod
    def validate(cls, value: Any, field: ModelField, config: BaseConfig) -> AnyUrl:
        return value.url
