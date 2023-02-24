# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from dataclasses import dataclass

from fastapi import Query, Response
from taiga.base.serializers import BaseModel
from taiga.conf import settings


@dataclass
class Pagination:
    offset: int
    limit: int
    total: int


class PaginationQuery(BaseModel):
    offset: int = Query(0, ge=0, description="Page offset number")
    limit: int = Query(
        settings.DEFAULT_PAGE_SIZE,
        ge=1,
        le=settings.MAX_PAGE_SIZE,
        description=f"Page size (max. {settings.MAX_PAGE_SIZE})",
    )


def set_pagination(response: Response, pagination: Pagination) -> None:
    response.headers["Pagination-Offset"] = str(pagination.offset)
    response.headers["Pagination-Limit"] = str(pagination.limit)
    response.headers["Pagination-Total"] = str(pagination.total)
