# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any

from fastapi import Response


def set_headers(response: Response, headers: dict[str, Any]) -> None:
    for k, v in headers.items():
        response.headers[f"Taiga-{k}"] = str(v)
