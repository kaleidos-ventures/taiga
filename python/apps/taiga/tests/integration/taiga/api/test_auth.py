# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


import pytest
from fastapi import status
from taiga.exceptions.api import codes
from taiga.tokens.auth import RefreshToken
from tests.utils import factories as f

pytestmark = pytest.mark.django_db(transaction=True)


def test_login_successfuly(client):
    username = "test_user"
    password = "test_password"
    f.UserFactory(username=username, password=password)

    response = client.post("/auth/token", json={"username": username, "password": password})
    assert response.status_code == 200, response.text
    assert response.json().keys() == {"token", "refresh"}


def test_login_error_invalid_credentials(client):
    username = "test_user"
    password = "test_password"

    response = client.post("/auth/token", json={"username": username, "password": password})
    assert response.status_code == status.HTTP_401_UNAUTHORIZED, response.text
    assert response.json()["error"]["code"] == codes.EX_AUTHENTICATION
    assert response.headers["www-authenticate"] == 'Bearer realm="api"'


def test_refresh_successfuly(client):
    user = f.UserFactory(username="test_user", password="test_password", is_active=True)
    token = RefreshToken.for_user(user)

    response = client.post("/auth/token/refresh", json={"refresh": str(token)})
    assert response.status_code == 200, response.text
    assert response.json().keys() == {"token", "refresh"}


def test_refresh_error_invalid_token(client):
    response = client.post("/auth/token/refresh", json={"refresh": "invalid_token"})
    assert response.status_code == status.HTTP_401_UNAUTHORIZED, response.text
    assert response.json()["error"]["code"] == codes.EX_AUTHENTICATION
