# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import AsyncMock, patch

import pytest
from taiga.tokens import exceptions as tokens_ex
from taiga.users import exceptions as ex
from taiga.users import services
from tests.utils import factories as f

##########################################################
# create_user
##########################################################


async def test_create_user_ok(tqmanager):
    email = "email@email.com"
    username = "email"
    full_name = "Full Name"
    password = "CorrectP4ssword$"
    user = await f.build_user(id=1, email=email, username=username, full_name=full_name)

    with (
        patch("taiga.users.services.users_repositories", autospec=True) as fake_users_repo,
        patch("taiga.users.services._generate_verify_user_token", return_value="verify_token"),
    ):
        fake_users_repo.user_exists.return_value = False
        fake_users_repo.create_user.return_value = user

        await services.create_user(email=email, full_name=full_name, password=password)

        fake_users_repo.create_user.assert_awaited_once_with(
            email=email, username=username, full_name=full_name, password=password
        )
        assert len(tqmanager.pending_jobs) == 1
        job = tqmanager.pending_jobs[0]
        assert "send_email" in job["task_name"]
        assert job["args"] == {
            "email_name": "sign_up",
            "to": "email@email.com",
            "email_data": {"verify_token": "verify_token"},
        }


async def test_create_user_email_exists():
    with (
        pytest.raises(ex.EmailAlreadyExistsError),
        patch("taiga.users.services.users_repositories", autospec=True) as fake_users_repo,
    ):
        fake_users_repo.user_exists.return_value = True
        await services.create_user(email="dup.email@email.com", full_name="Full Name", password="CorrectP4ssword&")


##########################################################
# verify_user
##########################################################


async def test_verify_user_ok():
    user = await f.build_user(is_active=False)
    user_data = {"id": 1}

    with (
        patch("taiga.users.services.VerifyUserToken", autospec=True) as FakeVerifyUserToken,
        patch("taiga.users.services.users_repositories", autospec=True) as fake_users_repo,
    ):
        fake_token = AsyncMock()
        fake_token.user_data = user_data
        FakeVerifyUserToken.create.return_value = fake_token
        fake_users_repo.get_first_user.return_value = user

        verified_user = await services.verify_user("some_token")

        assert verified_user == user

        fake_token.denylist.assert_awaited_once()
        fake_users_repo.get_first_user.assert_awaited_once_with(**user_data, is_active=False, is_system=False)
        fake_users_repo.verify_user.assert_awaited_once_with(user=user)


async def test_verify_user_with_used_token():
    with (
        patch("taiga.users.services.VerifyUserToken", autospec=True) as FakeVerifyUserToken,
        pytest.raises(ex.UsedVerifyUserTokenError),
    ):
        FakeVerifyUserToken.create.side_effect = tokens_ex.DeniedTokenError

        await services.verify_user("some_token")


async def test_verify_user_with_expired_token():
    with (
        patch("taiga.users.services.VerifyUserToken", autospec=True) as FakeVerifyUserToken,
        pytest.raises(ex.ExpiredVerifyUserTokenError),
    ):
        FakeVerifyUserToken.create.side_effect = tokens_ex.ExpiredTokenError

        await services.verify_user("some_token")


async def test_verify_user_with_invalid_token():
    with (
        patch("taiga.users.services.VerifyUserToken", autospec=True) as FakeVerifyUserToken,
        pytest.raises(ex.BadVerifyUserTokenError),
    ):
        FakeVerifyUserToken.create.side_effect = tokens_ex.TokenError

        await services.verify_user("some_token")


async def test_verify_user_with_invalid_data():
    user_data = {"id": 1}

    with (
        patch("taiga.users.services.VerifyUserToken", autospec=True) as FakeVerifyUserToken,
        patch("taiga.users.services.users_repositories", autospec=True) as fake_users_repo,
        pytest.raises(ex.BadVerifyUserTokenError),
    ):
        fake_token = AsyncMock()
        fake_token.user_data = user_data
        FakeVerifyUserToken.create.return_value = fake_token
        fake_users_repo.get_first_user.return_value = None

        await services.verify_user("some_token")


##########################################################
# clean_expired_users
##########################################################


async def test_clean_expired_users():
    with patch("taiga.users.services.users_repositories", autospec=True) as fake_users_repositories:
        await services.clean_expired_users()
        fake_users_repositories.clean_expired_users.assert_awaited_once()
