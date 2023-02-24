# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


import pytest
from fastapi import status
from taiga.auth.tokens import RefreshToken
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# auth/token
##########################################################


async def test_login_successfuly(client):
    password = "test_password"
    user = await f.create_user(password=password)

    data = {
        "username": user.username,
        "password": password,
    }

    response = client.post("/auth/token", json=data)
    assert response.status_code == 200, response.text
    assert response.json().keys() == {"token", "refresh"}


def test_login_error_invalid_credentials(client):
    data = {
        "username": "test_non_existing_user",
        "password": "test_password",
    }

    response = client.post("/auth/token", json=data)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED, response.text
    assert response.headers["www-authenticate"] == 'Bearer realm="api"'


##########################################################
# auth/token/refresh
##########################################################


async def test_refresh_successfuly(client):
    user = await f.create_user(is_active=True)
    token = await RefreshToken.create_for_object(user)
    data = {
        "refresh": str(token),
    }

    response = client.post("/auth/token/refresh", json=data)
    assert response.status_code == 200, response.text
    assert response.json().keys() == {"token", "refresh"}


def test_refresh_error_invalid_token(client):
    data = {"refresh": "invalid_token"}

    response = client.post("/auth/token/refresh", json=data)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED, response.text


##########################################################
# auth/token/deny
##########################################################


async def test_deny_refresh_token_success(client):
    user = await f.create_user()
    token = await RefreshToken.create_for_object(user)

    data = {
        "refresh": str(token),
    }

    client.login(user)
    response = client.post("/auth/token/deny", json=data)
    assert response.status_code == status.HTTP_204_NO_CONTENT, response.text


async def test_deny_refresh_token_error_bad_refresh_token(client):
    user = await f.create_user()

    data = {
        "refresh": "invalid_token",
    }

    client.login(user)
    response = client.post("/auth/token/deny", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_deny_refresh_token_error_forbidden_user(client):
    user = await f.create_user()
    other_user = await f.create_user()
    token = await RefreshToken.create_for_object(user)

    data = {
        "refresh": str(token),
    }

    client.login(other_user)
    response = client.post("/auth/token/deny", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


async def test_deny_refresh_token_error_annonymous_user(client):
    user = await f.create_user()
    token = await RefreshToken.create_for_object(user)

    data = {
        "refresh": str(token),
    }

    response = client.post("/auth/token/deny", json=data)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED, response.text
