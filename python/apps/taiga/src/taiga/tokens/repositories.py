# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
#
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

from datetime import datetime

from asgiref.sync import sync_to_async
from taiga.tokens.models import DenylistedToken, OutstandingToken
from taiga.users.models import User

###########################################
# Outstanding Token
###########################################


@sync_to_async
def create_outstanding_token(
    user: User, jti: str, token: str, created_at: datetime, expires_at: datetime
) -> OutstandingToken:
    return OutstandingToken.objects.create(
        user=user, jti=jti, token=token, created_at=created_at, expires_at=expires_at
    )


@sync_to_async
def get_or_create_outstanding_token(jti: str, token: str, expires_at: datetime) -> tuple[OutstandingToken, bool]:
    return OutstandingToken.objects.get_or_create(
        jti=jti,
        defaults={
            "token": token,
            "expires_at": expires_at,
        },
    )


###########################################
# Denylisted Token
###########################################


@sync_to_async
def get_or_create_denylisted_token(token: OutstandingToken) -> tuple[DenylistedToken, bool]:
    return DenylistedToken.objects.get_or_create(token=token)


@sync_to_async
def denylisted_token_exist(jti: str) -> bool:
    return DenylistedToken.objects.filter(token__jti=jti).exists()
