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
from taiga.integrations.github import services

pytestmark = pytest.mark.django_db()

##########################################################
# POST /auth/github
##########################################################

ACCESS_URL_REGEX = re.compile(f"{services.ACCESS_TOKEN_URL}.*")
EMAILS_URL_REGEX = re.compile(f"{services.EMAILS_API_URL}.*")
USER_URL_REGEX = re.compile(f"{services.USER_API_URL}.*")


async def test_github_login(client, httpx_mock):
    settings.GITHUB_CLIENT_ID = "id"
    settings.GITHUB_CLIENT_SECRET = "secret"
    httpx_mock.add_response(url=ACCESS_URL_REGEX, method="POST", status_code=200, json={"access_token": "TOKEN"})
    httpx_mock.add_response(
        url=EMAILS_URL_REGEX,
        method="GET",
        status_code=200,
        json=[
            {"email": "email1@email.com", "primary": False},
            {"email": "email2@email.com", "primary": True},
        ],
    )
    httpx_mock.add_response(
        url=USER_URL_REGEX,
        method="GET",
        status_code=200,
        json={
            "login": "username",
            "bio": "my bio",
            "name": "full name",
            "id": 1,
        },
    )

    data = {"code": "code", "lang": "es-ES"}
    response = client.post("/auth/github", json=data)

    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json().keys() == {"token", "refresh"}


async def test_github_login_not_configured(client, httpx_mock):
    settings.GITHUB_CLIENT_ID = None
    settings.GITHUB_CLIENT_SECRET = None

    data = {"code": "code"}
    response = client.post("/auth/github", json=data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_github_login_incorrect_code(client, httpx_mock):
    settings.GITHUB_CLIENT_ID = "id"
    settings.GITHUB_CLIENT_SECRET = "secret"
    httpx_mock.add_response(url=ACCESS_URL_REGEX, method="POST", status_code=400, json={"error": "ERROR"})

    data = {"code": "code"}
    response = client.post("/auth/github", json=data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_github_login_api_not_working(client, httpx_mock):
    settings.GITHUB_CLIENT_ID = "id"
    settings.GITHUB_CLIENT_SECRET = "secret"
    httpx_mock.add_response(url=ACCESS_URL_REGEX, method="POST", status_code=200, json={"access_token": "TOKEN"})
    httpx_mock.add_response(url=EMAILS_URL_REGEX, method="GET", status_code=400, json=[])
    httpx_mock.add_response(url=USER_URL_REGEX, method="GET", status_code=400, json=[])

    data = {"code": "code"}
    response = client.post("/auth/github", json=data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text
