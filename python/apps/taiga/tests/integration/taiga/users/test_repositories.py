# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from asgiref.sync import sync_to_async
from taiga.users import repositories as users_repositories
from taiga.users.models import User
from taiga.users.tokens import VerifyUserToken
from tests.utils import db
from tests.utils import factories as f

pytestmark = pytest.mark.django_db(transaction=True)


##########################################################
# get_user_by_username_or_email
##########################################################

# username


async def test_get_user_by_username_or_email_success_username_case_insensitive():
    user = await f.create_user(username="test_user_1")
    await f.create_user(username="test_user_2")
    assert user == await users_repositories.get_user_by_username_or_email(username_or_email="TEST_user_1")


async def test_get_user_by_username_or_email_success_username_case_sensitive():
    await f.create_user(username="test_user")
    user = await f.create_user(username="TEST_user")
    assert user == await users_repositories.get_user_by_username_or_email(username_or_email="TEST_user")


async def test_get_user_by_username_or_email_error_invalid_username_case_insensitive():
    await f.create_user(username="test_user")
    assert await users_repositories.get_user_by_username_or_email(username_or_email="TEST_other_user") is None


async def test_get_user_by_username_or_email_error_invalid_username_case_sensitive():
    await f.create_user(username="test_user")
    await f.create_user(username="TEST_user")
    assert await users_repositories.get_user_by_username_or_email(username_or_email="test_USER") is None


# email


async def test_get_user_by_username_or_email_success_email_case_insensitive():
    user = await f.create_user(email="test_user_1@email.com")
    await f.create_user(email="test_user_2@email.com")
    assert user == await users_repositories.get_user_by_username_or_email(username_or_email="TEST_user_1@email.com")


async def test_get_user_by_username_or_email_success_email_case_sensitive():
    await f.create_user(email="test_user@email.com")
    user = await f.create_user(email="TEST_user@email.com")
    assert user == await users_repositories.get_user_by_username_or_email(username_or_email="TEST_user@email.com")


async def test_get_user_by_username_or_email_error_invalid_email_case_insensitive():
    await f.create_user(email="test_user@email.com")
    assert await users_repositories.get_user_by_username_or_email(username_or_email="test_other_user@email.com") is None


async def test_get_user_by_username_or_email_error_invalid_email_case_sensitive():
    await f.create_user(email="test_user@email.com")
    await f.create_user(email="TEST_user@email.com")
    assert await users_repositories.get_user_by_username_or_email(username_or_email="test_USER@email.com") is None


##########################################################
# check_password / change_password
##########################################################


async def test_change_password_and_check_password():
    password1 = "password-one"
    password2 = "password-two"
    user = await f.create_user(password=password1)

    assert await users_repositories.check_password(user, password1)
    assert not await users_repositories.check_password(user, password2)

    await users_repositories.change_password(user, password2)

    assert not await users_repositories.check_password(user, password1)
    assert await users_repositories.check_password(user, password2)


##########################################################
# create_user
##########################################################


async def test_create_user():
    email = "email@email.com"
    username = "username"
    full_name = "Full Name"
    password = "password"
    user = await users_repositories.create_user(email=email, username=username, full_name=full_name, password=password)
    await db.refresh_model_from_db(user)
    assert user.username == username
    assert user.password


##########################################################
# activate_user
##########################################################


async def test_verify_user():
    user = await f.create_user(is_active=False)

    assert not user.is_active
    assert user.date_verification is None

    await users_repositories.verify_user(user)
    await db.refresh_model_from_db(user)

    assert user.is_active
    assert user.date_verification is not None


##########################################################
# clean_expired_users
##########################################################


@sync_to_async
def get_total_users() -> int:
    return User.objects.count()


async def test_clean_expired_users():
    total_users = await get_total_users()
    await f.create_user(is_active=False)  # without token - it'll be cleaned
    user = await f.create_user(is_active=False)  # with token - it won't be cleaned
    await VerifyUserToken.create_for_object(user)

    assert await get_total_users() == total_users + 2
    await users_repositories.clean_expired_users()
    assert await get_total_users() == total_users + 1


async def test_user_contacts_filtered():
    user1 = await f.create_user(is_active=True, email="email@email.com")
    user2 = await f.create_user(is_active=True, email="EMAIL@email.com")
    user3 = await f.create_user(is_active=False, email="inactive@email.com")
    user4 = await f.create_user(is_active=True, email="other_email@email.com")

    emails = [user1.email, user2.email, user3.email]

    contacts = await users_repositories.get_user_contacts(user_id=user1.id, emails=emails)
    assert len(contacts) == 1
    assert user1 not in contacts  # logged user
    assert user3 not in contacts  # inactive
    assert user4 not in contacts  # not considered in the email list
    assert user2 in contacts  # a case insensitive match


async def test_user_contacts_filtered_empty_emails():
    user1 = await f.create_user(is_active=True, email="email@email.com")
    user2 = await f.create_user(is_active=True, email="EMAIL@email.com")
    user3 = await f.create_user(is_active=False, email="inactive@email.com")
    user4 = await f.create_user(is_active=True, email="other_email@email.com")

    contacts = await users_repositories.get_user_contacts(user_id=user1.id, emails=[])

    assert len(contacts) == 2
    assert user1 not in contacts  # logged user
    assert user3 not in contacts  # inactive
    assert user2 in contacts  # case insensitive match
    assert user4 in contacts  # a normal match
