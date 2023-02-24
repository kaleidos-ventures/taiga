# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from dataclasses import dataclass

from taiga.base.i18n.choices import ScriptType, TextDirection


@dataclass
class LanguageSchema:
    code: str
    name: str
    english_name: str
    text_direction: TextDirection
    is_default: bool
    script_type: ScriptType
