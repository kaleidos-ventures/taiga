# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import uuid
from unittest.mock import Mock, patch

import pytest
from taiga.auth import services as auth_serv
from taiga.auth.services import exceptions as ex
from taiga.auth.tokens import AccessToken, RefreshToken
from tests.utils import factories as f

##########################################################
# login
##########################################################


async def test_login_success():
    username = "test_user"
    password = "test_password"
    user = f.build_user(username=username, password=password, is_active=True)

    with (
        patch("taiga.auth.services.users_repositories", autospec=True) as fake_users_repo,
        patch("taiga.tokens.base.tokens_services", autospec=True) as fake_tokens_services,
    ):
        fake_tokens_services.token_is_denied.return_value = False
        fake_tokens_services.outstanding_token_exist.return_value = False

        fake_users_repo.get_user.return_value = user
        fake_users_repo.check_password.return_value = True

        data = await auth_serv.login(username=username, password=password)

        assert data.token
        assert data.refresh

        fake_users_repo.get_user.assert_awaited_once_with(filters={"username_or_email": username, "is_active": True})
        fake_users_repo.check_password.assert_awaited_once_with(user=user, password=password)
        fake_users_repo.update_last_login.assert_awaited_once_with(user=user)


async def test_login_error_invalid_username():
    invalid_username = "invalid_username"
    password = "test_password"

    with patch("taiga.auth.services.users_repositories", autospec=True) as fake_users_repo:
        fake_users_repo.get_user.return_value = None

        data = await auth_serv.login(username=invalid_username, password=password)

        assert not data

        fake_users_repo.get_user.assert_awaited_once_with(
            filters={"username_or_email": invalid_username, "is_active": True}
        )
        fake_users_repo.check_password.assert_not_awaited()
        fake_users_repo.update_last_login.assert_not_awaited()


async def test_login_error_invalid_password():
    username = "test_user"
    password = "test_password"
    invalid_password = "invalid_password"
    user = f.build_user(username=username, password=password, is_active=True)

    with patch("taiga.auth.services.users_repositories", autospec=True) as fake_users_repo:
        fake_users_repo.get_user.return_value = user
        fake_users_repo.check_password.return_value = False

        data = await auth_serv.login(username=username, password=invalid_password)

        assert not data

        fake_users_repo.get_user.assert_awaited_once_with(filters={"username_or_email": username, "is_active": True})
        fake_users_repo.check_password.assert_awaited_once_with(user=user, password=invalid_password)
        fake_users_repo.update_last_login.assert_not_awaited()


##########################################################
# refresh
##########################################################


async def test_refresh_success():
    user = f.build_user(is_active=True)
    token = Mock()  # this is the code of the future refresh_token

    with patch("taiga.tokens.base.tokens_services", autospec=True) as fake_tokens_services:
        fake_tokens_services.token_is_denied.return_value = False
        fake_tokens_services.outstanding_token_exist.return_value = True
        fake_tokens_services.get_or_create_outstanding_token.return_value = (token, None)

        refresh_token = await RefreshToken.create_for_object(user)
        token.return_value = str(refresh_token)

        data = await auth_serv.refresh(token=str(refresh_token))

        assert data.token and data.token != str(refresh_token.access_token)
        assert data.refresh and data.refresh != str(refresh_token)

        fake_tokens_services.deny_token.assert_awaited_once_with(token=token)


async def test_refresh_error_invalid_token():
    data = await auth_serv.refresh(token="invalid_token")
    assert not data


##########################################################
# authenticate
##########################################################


async def test_authenticate_success():
    user = f.build_user(id=1, is_active=False)
    token = await AccessToken.create_for_object(user)

    with patch("taiga.auth.services.users_repositories", autospec=True) as fake_users_repo:
        fake_users_repo.get_user.return_value = user

        data = await auth_serv.authenticate(token=str(token))

        assert data[0] == ["auth"]
        assert data[1] == user


async def test_authenticate_error_bad_auth_token():
    with pytest.raises(ex.BadAuthTokenError):
        await auth_serv.authenticate(token="bad_token")


async def test_authenticate_error_inactive_user():
    user = f.build_user(id=1, is_active=False)
    token = await AccessToken.create_for_object(user)

    with patch("taiga.auth.services.users_repositories", autospec=True) as fake_users_repo:
        fake_users_repo.get_user.return_value = None

        with pytest.raises(ex.UnauthorizedUserError):
            await auth_serv.authenticate(token=str(token))


##########################################################
# deny_refresh_token
##########################################################


async def test_deny_refresh_token_success():
    user1 = f.build_user(id=uuid.uuid1(), is_active=True)
    token = Mock()  # this is the code of the future refresh_token

    with patch("taiga.tokens.base.tokens_services", autospec=True) as fake_tokens_services:
        fake_tokens_services.token_is_denied.return_value = False
        fake_tokens_services.outstanding_token_exist.return_value = True
        fake_tokens_services.get_or_create_outstanding_token.return_value = (token, None)

        refresh_token = await RefreshToken.create_for_object(user1)
        token.return_value = str(refresh_token)

        await auth_serv.deny_refresh_token(user=user1, token=str(refresh_token))

        fake_tokens_services.deny_token.assert_awaited_once_with(token=token)


async def test_deny_refresh_token_error_bad_refresh_token():
    user1 = f.build_user(id=uuid.uuid1(), is_active=True)
    invalid_token = "invalid_token"

    with patch("taiga.tokens.base.tokens_services", autospec=True) as fake_tokens_services:
        with pytest.raises(ex.BadRefreshTokenError):
            await auth_serv.deny_refresh_token(user=user1, token=invalid_token)

        fake_tokens_services.deny_token.assert_not_awaited()


async def test_deny_refresh_token_error_unauthorized_user():
    user1 = f.build_user(id=uuid.uuid1(), is_active=True)
    user2 = f.build_user(id=uuid.uuid1(), is_active=True)

    with patch("taiga.tokens.base.tokens_services", autospec=True) as fake_tokens_services:
        fake_tokens_services.token_is_denied.return_value = False
        fake_tokens_services.outstanding_token_exist.return_value = True

        refresh_token = await RefreshToken.create_for_object(user1)

        with pytest.raises(ex.UnauthorizedUserError):
            await auth_serv.deny_refresh_token(user=user2, token=str(refresh_token))

        fake_tokens_services.deny_token.assert_not_awaited()
