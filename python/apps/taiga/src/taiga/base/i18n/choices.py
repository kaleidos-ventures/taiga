# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from enum import Enum
from typing import Final

from taiga.base.utils.enum import OrderedEnum


class TextDirection(Enum):
    RTL = "rtl"
    LTR = "ltr"


class ScriptType(OrderedEnum):
    LATIN = "latin"
    CYRILLIC = "cyrillic"
    GREEK = "greek"
    HEBREW = "hebrew"
    ARABIC = "arabic"
    CHINESE_AND_DEVS = "chinese_and_devs"
    OTHER = "other"


LATIN_LANGS: Final[list[str]] = [
    "ca",
    "da",
    "de",
    "en",
    "es",
    "eu",
    "fi",
    "gl",
    "fr",
    "it",
    "lv",
    "nb",
    "nl",
    "pl",
    "pt",
    "sv",
    "tr",
    "vi",
]

CYRILLIC_LANGS: Final[list[str]] = [
    "bg",
    "bs",
    "uk",
    "sr",
    "ru",
]
GREEK_LANGS: Final[list[str]] = [
    "el",
]
HEBREW_LANGS: Final[list[str]] = [
    "he",
]
ARABIC_LANGS: Final[list[str]] = [
    "fa",
    "ar",
]
CHINESE_AND_DEV_LANGS: Final[list[str]] = [
    "ko",
    "zh",
    "ja",
]


def get_script_type(identifier: str) -> ScriptType:
    if identifier in LATIN_LANGS:
        return ScriptType.LATIN
    if identifier in CYRILLIC_LANGS:
        return ScriptType.CYRILLIC
    if identifier in GREEK_LANGS:
        return ScriptType.GREEK
    if identifier in HEBREW_LANGS:
        return ScriptType.HEBREW
    if identifier in ARABIC_LANGS:
        return ScriptType.ARABIC
    if identifier in CHINESE_AND_DEV_LANGS:
        return ScriptType.CHINESE_AND_DEVS
    return ScriptType.OTHER
