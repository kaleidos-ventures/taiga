# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from pydantic import BaseModel, validator
from taiga.conf import settings


class PaginationMixin(BaseModel):
    offset: int | None = 0
    limit: int | None = settings.MAX_PAGE_SIZE

    @validator("offset")
    def check_pagination_offset(cls, v: int) -> int:
        assert v >= 0, "Incorrect pagination offset"
        return v

    @validator("limit")
    def check_pagination_limit(cls, v: int) -> int:
        assert v <= settings.MAX_PAGE_SIZE, "Page limit exceeded"
        assert v >= 0, "Incorrect pagination limit"
        return v
