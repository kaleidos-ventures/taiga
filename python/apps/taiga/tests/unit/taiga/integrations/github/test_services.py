# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import re

from taiga.integrations.github import services

ACCESS_URL_REGEX = re.compile(f"{services.ACCESS_TOKEN_URL}.*")
EMAILS_URL_REGEX = re.compile(f"{services.EMAILS_API_URL}.*")
USER_URL_REGEX = re.compile(f"{services.USER_API_URL}.*")

##########################################################
# get_access_to_github
##########################################################


async def test_get_access_to_github_ok(httpx_mock):
    code = "code"
    httpx_mock.add_response(url=ACCESS_URL_REGEX, method="POST", status_code=200, json={"access_token": "TOKEN"})
    access_token = await services.get_access_to_github(code=code)
    assert access_token == "TOKEN"


async def test_get_access_to_github_ko(httpx_mock):
    code = "code"
    httpx_mock.add_response(url=ACCESS_URL_REGEX, method="POST", status_code=400, json={"error": "ERROR"})
    access_token = await services.get_access_to_github(code=code)
    assert access_token is None


##########################################################
# get_user_info_from_github
##########################################################


async def test_get_user_info_from_github_ok(httpx_mock):
    access_token = "access_token"
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
    user_profile = await services.get_user_info_from_github(access_token=access_token)
    assert user_profile


async def test_get_user_info_from_github_emails_api_wrong(httpx_mock):
    access_token = "access_token"
    httpx_mock.add_response(url=EMAILS_URL_REGEX, method="GET", status_code=400, json={"error": "ERROR"})
    httpx_mock.add_response(url=USER_URL_REGEX, method="GET", status_code=200, json={})
    user_profile = await services.get_user_info_from_github(access_token=access_token)
    assert user_profile is None


async def test_get_user_info_from_github_users_api_wrong(httpx_mock):
    access_token = "access_token"
    httpx_mock.add_response(
        url=EMAILS_URL_REGEX,
        method="GET",
        status_code=200,
        json=[
            {"email": "email1@email.com", "primary": False},
            {"email": "email2@email.com", "primary": True},
        ],
    )
    httpx_mock.add_response(url=USER_URL_REGEX, method="GET", status_code=400, json={"error": "ERROR"})
    user_profile = await services.get_user_info_from_github(access_token=access_token)
    assert user_profile is None
