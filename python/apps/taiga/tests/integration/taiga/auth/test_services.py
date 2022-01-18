# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


import pytest
from asgiref.sync import sync_to_async
from taiga.auth import exceptions as ex
from taiga.auth import services as auth_serv
from taiga.auth.tokens import AccessToken, RefreshToken
from taiga.tokens.models import DenylistedToken, OutstandingToken
from tests.utils import factories as f

pytestmark = pytest.mark.django_db(transaction=True)


##########################################################
# login
##########################################################


async def test_login_success():
    username = "test_user"
    password = "test_password"
    user = await f.create_user(username=username, password=password, is_active=True, is_system=False)

    data = await auth_serv.login(username=username, password=password)

    assert data.token
    assert data.refresh

    assert not user.last_login
    await sync_to_async(user.refresh_from_db)()
    assert user.last_login


async def test_login_error_invalid_username():
    username = "test_user"
    password = "test_password"
    await f.create_user(username=username, password=password, is_active=True, is_system=False)

    data = await auth_serv.login(username="bad_username", password=password)

    assert not data


async def test_login_error_invalid_password():
    username = "test_user"
    password = "test_password"
    await f.create_user(username=username, password=password, is_active=True, is_system=False)

    data = await auth_serv.login(username=username, password="bad_password")

    assert not data


async def test_login_error_inactive_user():
    username = "test_user"
    password = "test_password"
    await f.create_user(username=username, password=password, is_active=False, is_system=False)

    data = await auth_serv.login(username=username, password=password)

    assert not data


async def test_login_error_is_system_user():
    username = "test_user"
    password = "test_password"
    await f.create_user(username=username, password=password, is_active=True, is_system=True)

    data = await auth_serv.login(username=username, password=password)

    assert not data


##########################################################
# refresh
##########################################################


async def test_refresh_success():
    user = await f.create_user(is_active=True, is_system=False)
    refresh_token = await RefreshToken.create_for_user(user)

    assert await sync_to_async(OutstandingToken.objects.count)() == 1
    assert await sync_to_async(DenylistedToken.objects.count)() == 0

    data = await auth_serv.refresh(token=str(refresh_token))

    assert data.token and data.token != str(refresh_token.access_token)
    assert data.refresh and data.refresh != str(refresh_token)

    assert await sync_to_async(OutstandingToken.objects.count)() == 1
    assert await sync_to_async(DenylistedToken.objects.count)() == 1


async def test_refresh_error_invalid_token():
    data = await auth_serv.refresh(token="invalid_token")
    assert not data


##########################################################
# authenticate
##########################################################


async def test_authenticate_success():
    user = await f.create_user(is_active=True, is_system=False)
    token = await AccessToken.create_for_user(user)

    data = await auth_serv.authenticate(token=str(token))

    assert data[0] == ["auth"]
    assert data[1] == user


async def test_authenticate_error_bad_auth_token():
    with pytest.raises(ex.BadAuthTokenError):
        await auth_serv.authenticate(token="bad_token")


async def test_authenticate_error_inactive_user():
    user = await f.create_user(is_active=False, is_system=False)
    token = await AccessToken.create_for_user(user)

    with pytest.raises(ex.UnauthorizedUserError):
        await auth_serv.authenticate(token=str(token))


async def test_authenticate_system_user():
    user = await f.create_user(is_active=True, is_system=True)
    token = await AccessToken.create_for_user(user)

    with pytest.raises(ex.UnauthorizedUserError):
        await auth_serv.authenticate(token=str(token))
