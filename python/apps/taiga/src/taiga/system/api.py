# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.base.i18n import i18n
from taiga.base.i18n.dataclasses import Language
from taiga.routers import routes
from taiga.system.serializers import LanguageSerializer


@routes.system.get(
    "/languages",
    name="system.languages",
    summary="List system available languages",
    response_model=list[LanguageSerializer],
)
async def list_languages() -> list[Language]:
    return i18n.available_languages_info
