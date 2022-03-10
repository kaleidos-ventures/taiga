# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from fastapi import status
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# GET /users/me
##########################################################


async def test_me_error_no_authenticated_user(client):
    response = client.get("/users/me")

    assert response.status_code == 401


async def test_me_success(client):
    user = await f.create_user()

    client.login(user)
    response = client.get("/users/me")

    assert response.status_code == 200
    assert "email" in response.json().keys()


##########################################################
# POST /users
##########################################################


async def test_create_user_ok(client):
    data = {
        "email": "test.create@email.com",
        "fullName": "Ada Lovelace",
        "password": "correctP4ssword%",
        "acceptTerms": True,
    }

    response = client.post("/users", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_create_user_email_already_exists(client):
    data = {
        "email": "test.create@email.com",
        "fullName": "Ada Lovelace",
        "password": "correctP4ssword%",
        "acceptTerms": True,
    }
    client.post("/users", json=data)
    response = client.post("/users", json=data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST, response.text
