# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from contextvars import ContextVar

correlation_id: ContextVar[str | None] = ContextVar("correlation_id", default=None)


def get_current_correlation_id() -> str | None:
    return correlation_id.get()
