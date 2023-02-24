# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import re

from taiga.integrations.google import services

ACCESS_URL_REGEX = re.compile(f"{services.ACCESS_TOKEN_URL}.*")
USER_URL_REGEX = re.compile(f"{services.USER_API_URL}.*")

##########################################################
# get_access_to_google
##########################################################


async def test_get_access_to_google_ok(httpx_mock):
    code = "code"
    redirect_uri = "https://redirect.uri"
    httpx_mock.add_response(url=ACCESS_URL_REGEX, method="POST", status_code=200, json={"access_token": "TOKEN"})
    access_token = await services.get_access_to_google(code=code, redirect_uri=redirect_uri)
    assert access_token == "TOKEN"


async def test_get_access_to_google_ko(httpx_mock):
    code = "code"
    redirect_uri = "https://redirect.uri"
    httpx_mock.add_response(url=ACCESS_URL_REGEX, method="POST", status_code=400, json={"error": "ERROR"})
    access_token = await services.get_access_to_google(code=code, redirect_uri=redirect_uri)
    assert access_token is None


##########################################################
# get_user_info_from_google
##########################################################


async def test_get_user_info_from_google_ok(httpx_mock):
    access_token = "access_token"
    httpx_mock.add_response(
        url=USER_URL_REGEX,
        method="GET",
        status_code=200,
        json={"sub": "google_id", "email": "email", "name": "full name", "hd": "bio"},
    )
    user_profile = await services.get_user_info_from_google(access_token=access_token)
    assert user_profile.email == "email"
    assert user_profile.google_id == "google_id"
    assert user_profile.full_name == "full name"
    assert user_profile.bio == "bio"


async def test_get_user_info_from_google_users_api_wrong(httpx_mock):
    access_token = "access_token"
    httpx_mock.add_response(url=USER_URL_REGEX, method="GET", status_code=400, json={"error": "ERROR"})
    user_profile = await services.get_user_info_from_google(access_token=access_token)
    assert user_profile is None
