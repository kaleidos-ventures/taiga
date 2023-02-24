# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC
#
# The code is partially taken (and modified) from djangorestframework-simplejwt v. 4.7.1
# (https://github.com/jazzband/djangorestframework-simplejwt/tree/5997c1aee8ad5182833d6b6759e44ff0a704edb4)
# that is licensed under the following terms:
#
#   Copyright 2017 David Sanders
#
#   Permission is hereby granted, free of charge, to any person obtaining a copy of
#   this software and associated documentation files (the "Software"), to deal in
#   the Software without restriction, including without limitation the rights to
#   use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
#   of the Software, and to permit persons to whom the Software is furnished to do
#   so, subject to the following conditions:
#
#   The above copyright notice and this permission notice shall be included in all
#   copies or substantial portions of the Software.
#
#   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
#   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
#   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
#   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
#   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
#   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
#   SOFTWARE.

from taiga.auth.tokens import AccessToken, RefreshToken
from taiga.conf import settings

##########################################################
# RefreshToken
##########################################################


def test_refresh_token_init():
    # Should set token type claim
    token = RefreshToken()
    assert token[settings.TOKENS.TOKEN_TYPE_CLAIM] == "refresh"


def test_refresh_token_access_token_():
    # Should create an access token from a refresh token
    refresh = RefreshToken()
    refresh["test_claim"] = "arst"

    access = refresh.access_token

    assert isinstance(access, AccessToken)
    assert access[settings.TOKENS.TOKEN_TYPE_CLAIM] == "access"

    # Should keep all copyable claims from refresh token
    assert refresh["test_claim"] == access["test_claim"]

    # Should not copy certain claims from refresh token
    for claim in RefreshToken.no_copy_claims:
        assert access[claim] != refresh[claim]


##########################################################
# AccessToken
##########################################################


def test_access_token_init():
    # Should set token type claim
    token = AccessToken()
    assert token[settings.TOKENS.TOKEN_TYPE_CLAIM] == "access"
