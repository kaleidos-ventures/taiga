# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any

from fastapi import status
from taiga.base.serializers import BaseModel

http_response_dict = dict[int | str, dict[str, type[BaseModel] | type[list[BaseModel]]]]


def http_status_200(model: type[BaseModel] | type[list[Any]]) -> http_response_dict:
    return {status.HTTP_200_OK: {"model": model}}
