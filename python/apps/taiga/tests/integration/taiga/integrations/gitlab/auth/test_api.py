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
from taiga.integrations.gitlab import services

pytestmark = pytest.mark.django_db()

##########################################################
# POST /auth/gitlab
##########################################################

ACCESS_URL_REGEX = re.compile(f"{services.ACCESS_TOKEN_URL}.*")
USER_URL_REGEX = re.compile(f"{services.USER_API_URL}.*")


async def test_gitlab_login(client, httpx_mock):
    settings.GITHUB_CLIENT_ID = "id"
    settings.GITHUB_CLIENT_SECRET = "secret"
    httpx_mock.add_response(url=ACCESS_URL_REGEX, method="POST", status_code=200, json={"access_token": "TOKEN"})
    httpx_mock.add_response(
        url=USER_URL_REGEX,
        method="GET",
        status_code=200,
        json={
            "login": "username",
            "email": "me@email.com",
            "bio": "my bio",
            "name": "full name",
            "id": 1,
        },
    )

    data = {"code": "code", "redirect_uri": "https://redirect.uri"}
    response = client.post("/auth/gitlab", json=data)

    assert response.status_code == status.HTTP_200_OK, response.text
    assert response.json().keys() == {"token", "refresh"}


async def test_gitlab_login_not_configured(client, httpx_mock):
    settings.GITHUB_CLIENT_ID = None
    settings.GITHUB_CLIENT_SECRET = None

    data = {"code": "code", "redirect_uri": "https://redirect.uri"}
    response = client.post("/auth/gitlab", json=data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_gitlab_login_incorrect_code(client, httpx_mock):
    settings.GITHUB_CLIENT_ID = "id"
    settings.GITHUB_CLIENT_SECRET = "secret"
    httpx_mock.add_response(url=ACCESS_URL_REGEX, method="POST", status_code=400, json={"error": "ERROR"})

    data = {"code": "code", "redirect_uri": "https://redirect.uri"}
    response = client.post("/auth/gitlab", json=data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text


async def test_gitlab_login_api_not_working(client, httpx_mock):
    settings.GITHUB_CLIENT_ID = "id"
    settings.GITHUB_CLIENT_SECRET = "secret"
    httpx_mock.add_response(url=ACCESS_URL_REGEX, method="POST", status_code=200, json={"access_token": "TOKEN"})
    httpx_mock.add_response(url=USER_URL_REGEX, method="GET", status_code=400, json=[])

    data = {"code": "code", "redirect_uri": "https://redirect.uri"}
    response = client.post("/auth/gitlab", json=data)

    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text
