# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.i18n import i18n
from taiga.base.utils.datetime import display_lifetime


def test_display_lifetime():
    with i18n.use("en-US"):
        minutes = 3 * 24 * 60  # 3 days
        assert display_lifetime(minutes) == "3 days"

        minutes = 36 * 60  # 1,5 days
        assert display_lifetime(minutes) == "1 day"

        minutes = 24 * 60  # 1 day
        assert display_lifetime(minutes) == "1 day"

        minutes = 12 * 60  # 12 hours
        assert display_lifetime(minutes) == "12 hours"

        minutes = 210  # 3,5 hours
        assert display_lifetime(minutes) == "3 hours"

        minutes = 60  # 1 hour
        assert display_lifetime(minutes) == "1 hour"

        minutes = 45  # 45 minutes
        assert display_lifetime(minutes) == "45 minutes"

        minutes = 1  # 1 minute
        assert display_lifetime(minutes) == "1 minute"

        minutes = 0  # 0 minutes
        assert display_lifetime(minutes) == "0 minutes"

        minutes = -1  # -1 minutes
        assert display_lifetime(minutes) == "-1 minutes"
