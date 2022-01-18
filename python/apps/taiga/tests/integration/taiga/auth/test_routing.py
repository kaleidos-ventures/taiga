# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from fastapi import APIRouter
from taiga.auth.routing import AuthAPIRouter
from taiga.auth.tokens import AccessToken
from taiga.base.api import Request
from taiga.main import api
from tests.utils import factories as f
from tests.utils.testclient import TestClient

pytestmark = pytest.mark.django_db


def get_auth_info(request: Request):
    try:
        return {"user": request.user, "auth": request.auth}
    except AssertionError:
        return "no-auth"


common_router: APIRouter = APIRouter(prefix="/tests")
common_router.get("/not-authenticated-endpoint")(get_auth_info)

auth_router: APIRouter = AuthAPIRouter(prefix="/tests")
auth_router.get("/authenticated-endpoint")(get_auth_info)

api.include_router(common_router)
api.include_router(auth_router)

client = TestClient(api)


BASE_HEADERS = {
    "Origin": "https://example.org",
}


#
# Auth router
#


def test_auth_router_without_auth_token():
    headers = BASE_HEADERS

    response = client.get("/tests/authenticated-endpoint", headers=headers)
    assert response.status_code == 200, response.text
    assert "access-control-allow-origin" in response.headers.keys()
    assert "access-control-allow-credentials" in response.headers.keys()
    assert "auth" in response.json().keys()
    assert "user" in response.json().keys()


async def test_auth_router_with_valid_auth_token():
    user = await f.create_user()
    token = await AccessToken.create_for_user(user)
    headers = BASE_HEADERS | {
        "Authorization": f"Bearer {token}",
    }

    response = client.get("/tests/authenticated-endpoint", headers=headers)
    assert response.status_code == 200, response.text
    assert "access-control-allow-origin" in response.headers.keys()
    assert "access-control-allow-credentials" in response.headers.keys()
    assert "auth" in response.json().keys()
    assert "user" in response.json().keys()


def test_auth_router_with_invalid_auth_token():
    headers = BASE_HEADERS | {
        "Authorization": "Bearer invalid_token",
    }

    response = client.get("/tests/authenticated-endpoint", headers=headers)
    assert response.status_code == 401, response.text
    assert "access-control-allow-origin" in response.headers.keys()
    assert "access-control-allow-credentials" in response.headers.keys()
    assert "auth" not in response.json().keys()
    assert "user" not in response.json().keys()


#
# Common router
#


def test_router_without_auth_token():
    headers = BASE_HEADERS

    response = client.get("/tests/not-authenticated-endpoint", headers=headers)
    assert response.status_code == 200, response.text
    assert "access-control-allow-origin" in response.headers.keys()
    assert "access-control-allow-credentials" in response.headers.keys()
    assert "no-auth" in response.json()


async def test_router_with_valid_auth_token():
    user = await f.create_user()
    token = await AccessToken.create_for_user(user)
    headers = BASE_HEADERS | {
        "Authorization": f"Bearer {token}",
    }

    response = client.get("/tests/not-authenticated-endpoint", headers=headers)
    assert response.status_code == 200, response.text
    assert "access-control-allow-origin" in response.headers.keys()
    assert "access-control-allow-credentials" in response.headers.keys()
    assert "no-auth" in response.json()


def test_router_with_invalid_auth_token():
    headers = BASE_HEADERS | {
        "Authorization": "Bearer invalid_token",
    }

    response = client.get("/tests/not-authenticated-endpoint", headers=headers)
    assert response.status_code == 200, response.text
    assert "access-control-allow-origin" in response.headers.keys()
    assert "access-control-allow-credentials" in response.headers.keys()
    assert "no-auth" in response.json()
