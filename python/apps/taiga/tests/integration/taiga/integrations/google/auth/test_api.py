# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import re

import pytest
from fastapi import status
from taiga.conf import settings
from taiga.integrations.google import services

pytestmark = pytest.mark.django_db()

##########################################################
# POST /auth/google
##########################################################

ACCESS_URL_REGEX = re.compile(f"{services.ACCESS_TOKEN_URL}.*")
USER_URL_REGEX = re.compile(f"{services.USER_API_URL}.*")


async def test_google_login(client, httpx_mock):
    settings.GOOGLE_CLIENT_ID = "id"
    settings.GOOGLE_CLIENT_SECRET = "secret"
    httpx_mock.add_response(url=ACCESS_URL_REGEX, method="POST", status_code=200, json={"access_token": "TOKEN"})
    httpx_mock.add_response(
        url=USER_URL_REGEX,
        method="GET",
        status_code=200,
        json={"sub": "google_id", "email": "email", "name": "fullname", "hd": "my bio"},
    )

    data = {"code": "code", "redirect_uri": "https://redirect.uri", "lang": "es-ES"}
    response = client.post("/auth/google", json=data)

    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json().keys() == {"token", "refresh"}


async def test_google_login_not_configured(client, httpx_mock):
    settings.GOOGLE_CLIENT_ID = None
    settings.GOOGLE_CLIENT_SECRET = None

    data = {"code": "code", "redirect_uri": "https://redirect.uri"}
    response = client.post("/auth/google", json=data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_google_login_incorrect_code(client, httpx_mock):
    settings.GOOGLE_CLIENT_ID = "id"
    settings.GOOGLE_CLIENT_SECRET = "secret"
    httpx_mock.add_response(url=ACCESS_URL_REGEX, method="POST", status_code=400, json={"error": "ERROR"})

    data = {"code": "incorrect_code", "redirect_uri": "https://redirect.uri"}
    response = client.post("/auth/google", json=data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_google_login_api_not_working(client, httpx_mock):
    settings.GOOGLE_CLIENT_ID = "id"
    settings.GOOGLE_CLIENT_SECRET = "secret"
    httpx_mock.add_response(url=ACCESS_URL_REGEX, method="POST", status_code=200, json={"access_token": "TOKEN"})
    httpx_mock.add_response(url=USER_URL_REGEX, method="GET", status_code=400, json=[])

    data = {"code": "incorrect_code", "redirect_uri": "https://redirect.uri"}
    response = client.post("/auth/google", json=data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text
