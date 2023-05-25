# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from fastapi.params import Query
from humps.main import camelize, decamelize
from taiga.exceptions import api as ex

ORDER_DESC = """
List of fields to specify the ordering criteria. By default it will assume an ascending order, use the - sign
for a descending order.

Usage examples: `order=createdAt`, `order=createdAt&order=-text`
"""


class OrderQuery:
    _allowed: list[str] = []
    _default: list[str] = []

    def __init__(self, allowed: list[str], default: list[str]) -> None:
        self._allowed = allowed
        self._default = default

    def __call__(self, order: list[str] = Query([], description=ORDER_DESC)) -> list[str]:  # type: ignore
        values: list[str] = list(map(decamelize, order)) if order else self._default  # type: ignore
        if invalids := set(values).difference(set(self._allowed)):
            raise ex.ValidationError(f"Invalid ordering fields: {', '.join(map(camelize, invalids))}")

        return values
