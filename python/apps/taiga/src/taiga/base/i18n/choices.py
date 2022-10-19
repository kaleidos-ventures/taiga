# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Final

from taiga.base.utils.enum import OrderedEnum


class ScriptType(OrderedEnum):
    LATIN = "latin"
    CYRILLIC = "cyrillic"
    GREEK = "greek"
    HEBREW = "hebrew"
    ARABIC = "arabic"
    CHINESE_AND_DEVS = "chinese_and_devs"
    OTHER = "other"


# NOTE:
#   Language code format should be:
#     - {ISO 639-1 lang code}
#     - {ISO 639-1 lang code}_{ISO 3166-1 alpha-2 country code}


LATIN_LANGS: Final[list[str]] = [
    "ca",
    "ca_ES",
    "da",
    "da_DK",
    "de",
    "de_DE",
    "en",
    "en_GB",
    "en_US",
    "es",
    "es_ES",
    "eu",
    "eu_ES",
    "fi",
    "fi_FI",
    "gl",
    "gl_ES",
    "fr",
    "fr_FR",
    "it",
    "it_IT",
    "lv",
    "lv_LV",
    "nb",
    "nb_NO",
    "nl",
    "nl_NL",
    "pl",
    "pl_PL",
    "pt",
    "pt_BR",
    "pt_PT",
    "sv",
    "sv_SE",
    "tr",
    "tr_TR",
    "vi",
    "vi_VN",
]

CYRILLIC_LANGS: Final[list[str]] = [
    "bg",
    "bg_BG",
    "bs",
    "bs_BA",
    "uk",
    "uk_UA",
    "sr",
    "sr_RS",
    "ru",
    "ru_RU",
]
GREEK_LANGS: Final[list[str]] = [
    "el",
    "el_GR",
]
HEBREW_LANGS: Final[list[str]] = [
    "he",
    "he_IL",
]
ARABIC_LANGS: Final[list[str]] = [
    "fa",
    "fa_IR",
    "ar",
    "ar_SY",
]
CHINESE_AND_DEV_LANGS: Final[list[str]] = [
    "ko",
    "ko_KR",
    "zh",
    "zh_Hans",
    "zh_Hant",
    "ja",
    "ja_JP",
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
