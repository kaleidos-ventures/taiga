# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from taiga.users import repositories as users_repo
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# get_user_by_username_or_email
##########################################################

# username


def test_get_user_by_username_or_email_success_username_case_insensitive():
    user = f.UserFactory(username="test_user_1")
    f.UserFactory(username="test_user_2")
    assert user == users_repo.get_user_by_username_or_email(username_or_email="TEST_user_1")


def test_get_user_by_username_or_email_success_username_case_sensitive():
    f.UserFactory(username="test_user")
    user = f.UserFactory(username="TEST_user")
    assert user == users_repo.get_user_by_username_or_email(username_or_email="TEST_user")


def test_get_user_by_username_or_email_error_invalid_username_case_insensitive():
    f.UserFactory(username="test_user")
    assert users_repo.get_user_by_username_or_email(username_or_email="TEST_other_user") is None


def test_get_user_by_username_or_email_error_invalid_username_case_sensitive():
    f.UserFactory(username="test_user")
    f.UserFactory(username="TEST_user")
    assert users_repo.get_user_by_username_or_email(username_or_email="test_USER") is None


# email


def test_get_user_by_username_or_email_success_email_case_insensitive():
    user = f.UserFactory(email="test_user_1@email.com")
    f.UserFactory(email="test_user_2@email.com")
    assert user == users_repo.get_user_by_username_or_email(username_or_email="TEST_user_1@email.com")


def test_get_user_by_username_or_email_success_email_case_sensitive():
    f.UserFactory(email="test_user@email.com")
    user = f.UserFactory(email="TEST_user@email.com")
    assert user == users_repo.get_user_by_username_or_email(username_or_email="TEST_user@email.com")


def test_get_user_by_username_or_email_error_invalid_email_case_insensitive():
    f.UserFactory(email="test_user@email.com")
    assert users_repo.get_user_by_username_or_email(username_or_email="test_other_user@email.com") is None


def test_get_user_by_username_or_email_error_invalid_email_case_sensitive():
    f.UserFactory(email="test_user@email.com")
    f.UserFactory(email="TEST_user@email.com")
    assert users_repo.get_user_by_username_or_email(username_or_email="test_USER@email.com") is None
