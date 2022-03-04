# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any

from asgiref.sync import sync_to_async


@sync_to_async
def refresh_model_from_db(obj: Any) -> None:
    obj.refresh_from_db()
