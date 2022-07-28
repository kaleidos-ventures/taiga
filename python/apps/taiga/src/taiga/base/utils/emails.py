# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import re


def are_the_same(email1: str, email2: str) -> bool:
    """
    Compare two email addresses and check if they are the same.
    """
    return email1.casefold() == email2.casefold()


def is_email(value: str) -> bool:
    email_regex = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
    return bool(re.fullmatch(email_regex, value))
