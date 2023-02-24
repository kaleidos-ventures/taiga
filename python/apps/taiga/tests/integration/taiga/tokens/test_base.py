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

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from asgiref.sync import sync_to_async
from taiga.base.utils.datetime import epoch_to_datetime
from taiga.conf import settings
from taiga.tokens import commands
from taiga.tokens.base import DenylistMixin, Token
from taiga.tokens.exceptions import DeniedTokenError, TokenError
from taiga.tokens.models import DenylistedToken, OutstandingToken
from tests.utils import factories as f

pytestmark = pytest.mark.django_db(transaction=True)


class CommonToken(Token):
    token_type = "test-common-token"
    lifetime = timedelta(minutes=100)


class DeniableToken(DenylistMixin, Token):
    token_type = "test-deniable-token"
    lifetime = timedelta(minutes=100)
    is_unique = False


class UniqueToken(DenylistMixin, Token):
    token_type = "test-deniable-token"
    lifetime = timedelta(minutes=100)
    is_unique = True


ot_count = sync_to_async(OutstandingToken.objects.count)
ot_first = sync_to_async(OutstandingToken.objects.select_related("denylistedtoken").first)
ot_last = sync_to_async(OutstandingToken.objects.select_related("denylistedtoken").last)

dt_count = sync_to_async(DenylistedToken.objects.count)
dt_create = sync_to_async(DenylistedToken.objects.create)

##########################################################
# DenylistMixin
##########################################################


async def test_refresh_tokens_are_added_to_outstanding_list():
    user = await f.create_user()
    token = await DeniableToken.create_for_object(user)

    assert await ot_count() == 1

    outstanding_token = await ot_first()

    assert outstanding_token.object_id == user.id
    assert outstanding_token.jti == token["jti"]
    assert outstanding_token.token == str(token)
    assert outstanding_token.created_at == token.current_time
    assert outstanding_token.expires_at == epoch_to_datetime(token["exp"])


async def test_common_tokens_are_not_added_to_outstanding_list():
    user = await f.create_user()
    await CommonToken.create_for_object(user)

    assert await ot_count() == 0


async def test_token_will_not_validate_if_denylisted():
    user = await f.create_user()
    token = await DeniableToken.create_for_object(user)
    outstanding_token = await ot_first()

    # Should raise no exception
    await DeniableToken.create(str(token))

    # Add token to denylist
    await dt_create(token=outstanding_token)

    with pytest.raises(DeniedTokenError) as e:
        # Should raise exception
        await DeniableToken.create(str(token))
        assert "denylisted" in e.exception.args[0]


async def test_tokens_can_be_manually_denylisted():
    user = await f.create_user()

    assert await ot_count() == 0
    assert await dt_count() == 0

    token = await DeniableToken.create_for_object(user)
    # Should raise no exception
    await DeniableToken.create(str(token))

    assert await ot_count() == 1
    assert await dt_count() == 0

    # Add token to denylist
    await token.denylist()

    # Should not add token to outstanding list if already present
    assert await ot_count() == 1
    assert await dt_count() == 1

    # Should return denylist record and boolean to indicate creation
    denylisted_token = (await ot_first()).denylistedtoken
    assert denylisted_token.token.jti == token["jti"]

    with pytest.raises(DeniedTokenError) as e:
        # Should raise exception
        await DeniableToken.create(str(token))
        assert "denylisted" in e.exception.args[0]

    # If denylisted token already exists, no create it
    await token.denylist()

    assert await ot_count() == 1
    assert await dt_count() == 1

    denylisted_token = (await ot_first()).denylistedtoken
    assert denylisted_token.token.jti == token["jti"]

    # Should add token to outstanding list if not already present
    new_token = await DeniableToken.create()
    await new_token.denylist()

    assert await ot_count() == 2
    assert await dt_count() == 2

    new_denylisted_token = (await ot_last()).denylistedtoken
    assert new_denylisted_token.token.jti == new_token["jti"]


async def test_flush_expired_tokens_should_delete_any_expired_tokens():
    user = await f.create_user()

    # Make some tokens that won't expire soon
    not_expired_1 = await DeniableToken.create_for_object(user)
    not_expired_2 = await DeniableToken.create_for_object(user)
    not_expired_3 = await DeniableToken.create()

    # Denylist fresh tokens
    await not_expired_2.denylist()
    await not_expired_3.denylist()

    # Make tokens with fake exp time that will expire soon
    now = datetime.now(timezone.utc) - timedelta(minutes=settings.REFRESH_TOKEN_LIFETIME)

    with patch("taiga.tokens.base.aware_utcnow") as fake_aware_utcnow:
        fake_aware_utcnow.return_value = now
        expired_1 = await DeniableToken.create_for_object(user)
        expired_2 = await DeniableToken.create()

    # Denylist expired tokens
    await expired_1.denylist()
    await expired_2.denylist()

    # Make another token that won't expire soon
    not_expired_4 = await DeniableToken.create_for_object(user)

    # Should be certain number of outstanding tokens and denylisted
    # tokens
    assert await ot_count() == 6
    assert await dt_count() == 4

    commands.clean()

    # Expired outstanding *and* denylisted tokens should be gone
    assert await ot_count() == 4
    assert await dt_count() == 2

    ots = await sync_to_async(lambda: list(OutstandingToken.objects.order_by("id").values_list("jti", flat=True)))()
    assert ots == [
        not_expired_1["jti"],
        not_expired_2["jti"],
        not_expired_3["jti"],
        not_expired_4["jti"],
    ]

    dts = await sync_to_async(
        lambda: list(DenylistedToken.objects.order_by("id").values_list("token__jti", flat=True))
    )()
    assert dts == [not_expired_2["jti"], not_expired_3["jti"]]


async def test_create_multiples_tokens_not_unique_for_the_same_user():
    user = await f.create_user()

    # Make some tokens for the same user
    await DeniableToken.create_for_object(user)
    await DeniableToken.create_for_object(user)

    assert await ot_count() == 2
    assert await dt_count() == 0


async def test_create_multiples_tokens_unique_for_the_same_user():
    user = await f.create_user()

    # Make some tokens for the same user
    await UniqueToken.create_for_object(user)
    await UniqueToken.create_for_object(user)

    assert await ot_count() == 1
    assert await dt_count() == 0


async def test_old_unique_token_is_not_valid():
    user = await f.create_user()

    # Make some tokens for the same user
    old_token = await UniqueToken.create_for_object(user)
    new_token = await UniqueToken.create_for_object(user)

    # Old token should raise exception
    with pytest.raises(TokenError):
        await UniqueToken.create(str(old_token))

    await UniqueToken.create(str(new_token))
    await new_token.denylist()

    # New token should raise exception if it's used
    with pytest.raises(DeniedTokenError):
        await UniqueToken.create(str(new_token))
