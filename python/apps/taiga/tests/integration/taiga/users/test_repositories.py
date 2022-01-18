# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from taiga.users import repositories as users_repo
from tests.utils import factories as f

pytestmark = pytest.mark.django_db(transaction=True)


##########################################################
# get_user_by_username_or_email
##########################################################

# username


async def test_get_user_by_username_or_email_success_username_case_insensitive():
    user = await f.create_user(username="test_user_1")
    await f.create_user(username="test_user_2")
    assert user == await users_repo.get_user_by_username_or_email(username_or_email="TEST_user_1")


async def test_get_user_by_username_or_email_success_username_case_sensitive():
    await f.create_user(username="test_user")
    user = await f.create_user(username="TEST_user")
    assert user == await users_repo.get_user_by_username_or_email(username_or_email="TEST_user")


async def test_get_user_by_username_or_email_error_invalid_username_case_insensitive():
    await f.create_user(username="test_user")
    assert await users_repo.get_user_by_username_or_email(username_or_email="TEST_other_user") is None


async def test_get_user_by_username_or_email_error_invalid_username_case_sensitive():
    await f.create_user(username="test_user")
    await f.create_user(username="TEST_user")
    assert await users_repo.get_user_by_username_or_email(username_or_email="test_USER") is None


# email


async def test_get_user_by_username_or_email_success_email_case_insensitive():
    user = await f.create_user(email="test_user_1@email.com")
    await f.create_user(email="test_user_2@email.com")
    assert user == await users_repo.get_user_by_username_or_email(username_or_email="TEST_user_1@email.com")


async def test_get_user_by_username_or_email_success_email_case_sensitive():
    await f.create_user(email="test_user@email.com")
    user = await f.create_user(email="TEST_user@email.com")
    assert user == await users_repo.get_user_by_username_or_email(username_or_email="TEST_user@email.com")


async def test_get_user_by_username_or_email_error_invalid_email_case_insensitive():
    await f.create_user(email="test_user@email.com")
    assert await users_repo.get_user_by_username_or_email(username_or_email="test_other_user@email.com") is None


async def test_get_user_by_username_or_email_error_invalid_email_case_sensitive():
    await f.create_user(email="test_user@email.com")
    await f.create_user(email="TEST_user@email.com")
    assert await users_repo.get_user_by_username_or_email(username_or_email="test_USER@email.com") is None
