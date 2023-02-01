# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

"""
This module is a wrapper of :py:mod: `babel.dates` to use the current selected locale to formatting date and time.

See the docs at `Babel - Date and Time <https://babel.pocoo.org/en/latest/api/dates.html>`_.
"""
from typing import Any, Callable

from babel import dates
from taiga.base.i18n import i18n


def _using_current_lang(func: Callable[..., Any]) -> Callable[..., Any]:
    def _wrapped_func(*args: Any, **kwargs: Any) -> Any:
        return func(*args, locale=i18n.locale, **kwargs)

    return _wrapped_func


format_datetime = _using_current_lang(dates.format_datetime)
format_date = _using_current_lang(dates.format_date)
format_time = _using_current_lang(dates.format_time)
