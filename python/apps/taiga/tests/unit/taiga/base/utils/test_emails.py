# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from taiga.base.utils import emails


@pytest.mark.parametrize(
    "first_email, second_email, expected",
    [
        # True
        ("test@email.com", "test@email.com", True),
        ("TEST@EMAIL.COM", "test@email.com", True),
        ("test@email.com", "TEST@EMAIL.COM", True),
        ("test@email.com", "teST@EMail.com", True),
        ("test@emaIL.COm", "test@email.com", True),
        ("te+st@email.com", "te+st@email.com", True),
        ("test@subdomain.email.com", "test@subdomain.email.com", True),
        # False
        ("test1@email.com", "test@email.com", False),
        ("test@email.com", "other@email.com", False),
        ("test@email.com", "test@bemail.es", False),
        ("test@email.com", "tes.t@email.com", False),
        ("tes+t@email.com", "test@email.com", False),
    ],
)
async def test_emails_are_the_same(first_email, second_email, expected):
    assert emails.are_the_same(first_email, second_email) == expected


@pytest.mark.parametrize(
    "value, expected",
    [
        # True
        ("test@email.com", True),
        ("test+something@email.com", True),
        ("test.123@email.com", True),
        ("test@emaIL.comm", True),
        ("test@subdomain.email.com", True),
        # False
        ("test1@com", False),
        ("test@", False),
        ("test", False),
        ("test@.com", False),
        ("test@email.", False),
        ("@email.", False),
    ],
)
async def test_is_email(value, expected):
    assert emails.is_email(value) == expected
