# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from pydantic import validator
from taiga.base.i18n import i18n
from taiga.base.serializers import BaseModel


class GitlabLoginValidator(BaseModel):
    code: str
    redirect_uri: str
    lang: str | None

    @validator("lang")
    def check_lang(cls, v: str) -> str:
        if v:
            assert v in i18n.available_languages, "Language is not available"
        return v
