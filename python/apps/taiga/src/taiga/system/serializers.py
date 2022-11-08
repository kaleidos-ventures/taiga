# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Literal

from taiga.base.i18n.choices import ScriptType
from taiga.base.serializers import BaseModel


class LanguageSerializer(BaseModel):
    code: str
    name: str
    english_name: str
    script_type: ScriptType
    text_direction: Literal["ltr"] | Literal["rtl"]
    is_default: bool
