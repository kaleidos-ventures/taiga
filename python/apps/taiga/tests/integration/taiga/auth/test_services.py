# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from taiga.auth import exceptions as ex
from taiga.auth import services as auth_serv
from taiga.auth.tokens import AccessToken, RefreshToken
from taiga.tokens.models import DenylistedToken, OutstandingToken
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# login
##########################################################


def test_login_success():
    username = "test_user"
    password = "test_password"
    user = f.UserFactory(username=username, password=password, is_active=True, is_system=False)

    data = auth_serv.login(username=username, password=password)

    assert data.token
    assert data.refresh

    assert not user.last_login
    user.refresh_from_db()
    assert user.last_login


def test_login_error_invalid_username():
    username = "test_user"
    password = "test_password"
    f.UserFactory(username=username, password=password, is_active=True, is_system=False)

    data = auth_serv.login(username="bad_username", password=password)

    assert not data


def test_login_error_invalid_password():
    username = "test_user"
    password = "test_password"
    f.UserFactory(username=username, password=password, is_active=True, is_system=False)

    data = auth_serv.login(username=username, password="bad_password")

    assert not data


def test_login_error_inactive_user():
    username = "test_user"
    password = "test_password"
    f.UserFactory(username=username, password=password, is_active=False, is_system=False)

    data = auth_serv.login(username=username, password=password)

    assert not data


def test_login_error_is_system_user():
    username = "test_user"
    password = "test_password"
    f.UserFactory(username=username, password=password, is_active=True, is_system=True)

    data = auth_serv.login(username=username, password=password)

    assert not data


##########################################################
# refresh
##########################################################


def test_refresh_success():
    user = f.UserFactory(is_active=True, is_system=False)
    refresh_token = RefreshToken.for_user(user)

    assert OutstandingToken.objects.count() == 1
    assert DenylistedToken.objects.count() == 0

    data = auth_serv.refresh(token=str(refresh_token))

    assert data.token and data.token != str(refresh_token.access_token)
    assert data.refresh and data.refresh != str(refresh_token)

    assert OutstandingToken.objects.count() == 1
    assert DenylistedToken.objects.count() == 1


def test_refresh_error_invalid_token():
    data = auth_serv.refresh(token="invalid_token")
    assert not data


##########################################################
# authenticate
##########################################################


def test_authenticate_success():
    user = f.UserFactory(is_active=True, is_system=False)
    token = AccessToken.for_user(user)

    data = auth_serv.authenticate(token=str(token))

    assert data[0] == ["auth"]
    assert data[1] == user


def test_authenticate_error_bad_auth_token():
    with pytest.raises(ex.BadAuthTokenError):
        auth_serv.authenticate(token="bad_token")


def test_authenticate_error_inactive_user():
    user = f.UserFactory(is_active=False, is_system=False)
    token = AccessToken.for_user(user)

    with pytest.raises(ex.UnauthorizedUserError):
        auth_serv.authenticate(token=str(token))


def test_authenticate_system_user():
    user = f.UserFactory(is_active=True, is_system=True)
    token = AccessToken.for_user(user)

    with pytest.raises(ex.UnauthorizedUserError):
        auth_serv.authenticate(token=str(token))
