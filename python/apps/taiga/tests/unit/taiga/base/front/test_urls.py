# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from taiga.base.front import resolve_front_url
from taiga.base.front.exceptions import InvalidFrontUrl


def test_resolve_front_url_success():
    relative_uri = "VERIFY_SIGNUP"
    verification_token = "ayJ0eXAiOiJKV1QaLCJhbGciOiJIUzI1fiJ9"

    url = resolve_front_url(url_key=relative_uri, verification_token=verification_token)

    assert url == "http://localhost:4200/signup/verify/ayJ0eXAiOiJKV1QaLCJhbGciOiJIUzI1fiJ9"


def test_resolve_front_url_error():
    relative_uri = "BAD_URI"
    verification_token = "ayJ0eXAiOiJKV1QaLCJhbGciOiJIUzI1fiJ9"

    with pytest.raises(InvalidFrontUrl):
        resolve_front_url(url_key=relative_uri, verification_token=verification_token)


def test_resolve_front_url_with_params():
    relative_uri = "VERIFY_SIGNUP"
    verification_token = "ayJ0eXAiOiJKV1QaLCJhbGciOiJIUzI1fiJ9"
    query_params = {"param1": "A", "param2": "B"}

    url = resolve_front_url(relative_uri, verification_token=verification_token, query_params=query_params)

    assert url == "http://localhost:4200/signup/verify/ayJ0eXAiOiJKV1QaLCJhbGciOiJIUzI1fiJ9?param1=A&param2=B"
