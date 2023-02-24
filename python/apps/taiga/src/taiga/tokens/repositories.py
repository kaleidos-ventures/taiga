# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC
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
from taiga.base.db.models import ContentType, Model
from taiga.base.utils.datetime import aware_utcnow
from taiga.tokens.models import DenylistedToken, OutstandingToken

###########################################
# Outstanding Token
###########################################


@sync_to_async
def create_outstanding_token(
    obj: Model, jti: str, token_type: str, token: str, created_at: datetime, expires_at: datetime
) -> OutstandingToken:
    content_type = ContentType.objects.get_for_model(obj)
    object_id = obj.pk

    return OutstandingToken.objects.create(
        content_type=content_type,
        object_id=object_id,
        jti=jti,
        token_type=token_type,
        token=token,
        created_at=created_at,
        expires_at=expires_at,
    )


@sync_to_async
def update_or_create_outstanding_token(
    obj: Model, jti: str, token_type: str, token: str, created_at: datetime, expires_at: datetime
) -> tuple[OutstandingToken, bool]:
    content_type = ContentType.objects.get_for_model(obj)
    object_id = obj.pk

    return OutstandingToken.objects.update_or_create(
        content_type=content_type,
        object_id=object_id,
        token_type=token_type,
        defaults={"jti": jti, "token": token, "created_at": created_at, "expires_at": expires_at},
    )


@sync_to_async
def get_or_create_outstanding_token(
    jti: str, token_type: str, token: str, expires_at: datetime
) -> tuple[OutstandingToken, bool]:
    return OutstandingToken.objects.get_or_create(
        jti=jti,
        defaults={
            "token_type": token_type,
            "token": token,
            "expires_at": expires_at,
        },
    )


@sync_to_async
def outstanding_token_exist(jti: str) -> bool:
    return OutstandingToken.objects.filter(jti=jti).exists()


###########################################
# Denylisted Token
###########################################


@sync_to_async
def get_or_create_denylisted_token(token: OutstandingToken) -> tuple[DenylistedToken, bool]:
    return DenylistedToken.objects.get_or_create(token=token)


@sync_to_async
def denylisted_token_exist(jti: str) -> bool:
    return DenylistedToken.objects.filter(token__jti=jti).exists()


@sync_to_async
def clean_expired_tokens() -> None:
    OutstandingToken.objects.filter(expires_at__lt=aware_utcnow()).delete()
