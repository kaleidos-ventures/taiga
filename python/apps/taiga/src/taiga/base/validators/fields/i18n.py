# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any, Callable, Generator, Type

from taiga.base.i18n import i18n
from taiga.conf import settings

CallableGenerator = Generator[Callable[..., Any], None, None]


class LanguageCode(str):
    @classmethod
    def __modify_schema__(cls: Type["LanguageCode"], field_schema: dict[str, Any]) -> None:
        field_schema["example"] = settings.LANG
        field_schema["enum"] = i18n.available_languages

    @classmethod
    def __get_validators__(cls: Type["LanguageCode"]) -> CallableGenerator:
        yield cls.validate

    @classmethod
    def validate(cls: Type["LanguageCode"], value: str) -> str:
        assert i18n.is_language_available(value), "Language is not available"
        return value
