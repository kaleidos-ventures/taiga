# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
#
# The code is partially taken (and modified) from djangorestframework-simplejwt v. 4.7.1
# (https://github.com/jazzband/djangorestframework-simplejwt/tree/5997c1aee8ad5182833d6b6759e44ff0a704edb4)
# that is licensed under the following terms:

import time
from calendar import timegm
from datetime import datetime
from datetime import time as datetime_time
from datetime import timedelta, timezone

_AnyTime = datetime | datetime_time


def is_aware(value: _AnyTime) -> bool:
    """
    Determines if a given datetime.datetime is aware.

    The concept is defined in Python's docs:
    http://docs.python.org/library/datetime.html#datetime.tzinfo

    Assuming value.tzinfo is either None or a proper datetime.tzinfo,
    value.utcoffset() implements the appropriate logic.
    """
    return value.utcoffset() is not None


def is_naive(value: _AnyTime) -> bool:
    """
    Determines if a given datetime.datetime is naive.

    The concept is defined in Python's docs:
    http://docs.python.org/library/datetime.html#datetime.tzinfo

    Assuming value.tzinfo is either None or a proper datetime.tzinfo,
    value.utcoffset() implements the appropriate logic.
    """
    return value.utcoffset() is None


def aware_utcnow() -> datetime:
    """
    Returns an aware datetime.utcnow()
    """
    return datetime.utcnow().replace(tzinfo=timezone.utc)


def datetime_to_epoch(dt: datetime) -> int:
    """
    Convert a datetime.datetime to its unix time representation.
    """
    return timegm(dt.utctimetuple())


def epoch_to_datetime(ts: int) -> datetime:
    """
    Convert a unix time representation to a datetime.datetime.
    """
    return datetime.fromtimestamp(ts, tz=timezone.utc)


def timestamp_mics() -> int:
    """
    Return timestamp in microseconds.
    """
    return int(time.time() * 1000000)


def display_lifetime(minutes: int) -> str:
    """
    This function takes minutes and try to round them to days, hours or minutes.
    If minutes are less than a day, then it returns hours.
    If minutes are less than an hour, then it returns the minutes.
    """
    days = minutes // (24 * 60)
    if days > 0:
        return f"{days} days" if days > 1 else f"{days} day"
    else:
        hours = minutes // 60
        if hours > 0:
            return f"{hours} hours" if hours > 1 else f"{hours} hour"
        else:
            return f"{minutes} minutes" if minutes <= 0 or minutes > 1 else f"{minutes} minute"


def duration_iso_string(duration: timedelta) -> str:
    """
    Convert a timedelta objet to its ISO string representation.

    .. sourcecode:: python
        In: duration_iso_string(timedelta(days=2, seconds=4))
        Out: 'P2DT00H00M04S'

    Based on django code https://github.com/django/django/tree/stable/4.0.x/django/utils/duration.py#L31
    """

    def _get_duration_components(duration: timedelta) -> tuple[int, int, int, int, int]:
        days = duration.days
        seconds = duration.seconds
        microseconds = duration.microseconds

        minutes = seconds // 60
        seconds = seconds % 60

        hours = minutes // 60
        minutes = minutes % 60

        return days, hours, minutes, seconds, microseconds

    if duration < timedelta(0):
        sign = "-"
        duration *= -1
    else:
        sign = ""

    days, hours, minutes, seconds, microseconds = _get_duration_components(duration)
    ms = ".{:06d}".format(microseconds) if microseconds else ""
    return "{}P{}DT{:02d}H{:02d}M{:02d}{}S".format(sign, days, hours, minutes, seconds, ms)
