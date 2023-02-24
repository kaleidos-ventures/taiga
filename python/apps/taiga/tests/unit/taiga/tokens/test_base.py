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

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import jwt
import pytest
from taiga.base.utils.datetime import datetime_to_epoch
from taiga.conf import settings
from taiga.tokens.base import Token, token_backend
from taiga.tokens.exceptions import ExpiredTokenError, TokenError


@dataclass
class User:
    id: int
    username: str


class MyToken(Token):
    token_type = "test"
    lifetime = timedelta(days=1)


class MyTokenWithoutLifetime(Token):
    token_type = "test"
    lifetime = None


@pytest.fixture
async def token() -> MyToken:
    return await MyToken.create()


##########################################################
# Token
##########################################################


async def test_init_no_token_type() -> None:
    class MyTestToken(Token):
        pass

    with pytest.raises(TokenError):
        await MyTestToken.create()

    MyTestToken.token_type = "test"
    await MyTestToken.create()


async def test_init_no_token_given() -> None:
    now = datetime(year=2000, month=1, day=1, tzinfo=timezone.utc)

    with patch("taiga.tokens.base.aware_utcnow") as fake_aware_utcnow:
        fake_aware_utcnow.return_value = now
        t = await MyToken.create()

    assert t.current_time == now
    assert t.token is None

    assert len(t.payload) == 3
    assert t.payload["exp"] == datetime_to_epoch(now + MyToken.lifetime)
    assert "jti" in t.payload
    assert t.payload[settings.TOKENS.TOKEN_TYPE_CLAIM] == MyToken.token_type


async def test_init_token_given() -> None:
    # Test successful instantiation
    original_now = datetime.now(timezone.utc)

    with patch("taiga.tokens.base.aware_utcnow") as fake_aware_utcnow:
        fake_aware_utcnow.return_value = original_now
        good_token = await MyToken.create()

    good_token["some_value"] = "arst"
    encoded_good_token = str(good_token)

    now = datetime.now(timezone.utc)

    # Create new token from encoded token
    with patch("taiga.tokens.base.aware_utcnow") as fake_aware_utcnow:
        fake_aware_utcnow.return_value = now
        # Should raise no exception
        t = await MyToken.create(encoded_good_token)

    # Should have expected properties
    assert t.current_time == now
    assert t.token == encoded_good_token

    assert len(t.payload) == 4
    assert t["some_value"] == "arst"
    assert t["exp"] == datetime_to_epoch(original_now + MyToken.lifetime)
    assert t[settings.TOKENS.TOKEN_TYPE_CLAIM] == MyToken.token_type
    assert "jti" in t.payload


async def test_init_token_given_without_lifetime() -> None:
    # Test successful instantiation
    good_token = await MyTokenWithoutLifetime.create()

    good_token["some_value"] = "arst"
    encoded_good_token = str(good_token)

    # Create new token from encoded token
    t = await MyTokenWithoutLifetime.create(encoded_good_token)

    # Should have expected properties
    assert t.token == encoded_good_token

    assert len(t.payload) == 3
    assert t["some_value"] == "arst"
    assert "exp" not in t.payload
    assert t[settings.TOKENS.TOKEN_TYPE_CLAIM] == MyTokenWithoutLifetime.token_type
    assert "jti" in t.payload


async def test_init_bad_sig_token_given() -> None:
    # Test backend rejects encoded token (expired or bad signature)
    payload = {"foo": "bar"}
    payload["exp"] = datetime_to_epoch(datetime.utcnow() + timedelta(days=1))
    token_1 = jwt.encode(payload, settings.TOKENS.SIGNING_KEY, algorithm="HS256")
    payload["foo"] = "baz"
    token_2 = jwt.encode(payload, settings.TOKENS.SIGNING_KEY, algorithm="HS256")

    token_2_payload = token_2.rsplit(".", 1)[0]
    token_1_sig = token_1.rsplit(".", 1)[-1]
    invalid_token = token_2_payload + "." + token_1_sig

    with pytest.raises(TokenError):
        await MyToken.create(invalid_token)


async def test_init_bad_sig_token_given_no_verify() -> None:
    # Test backend rejects encoded token (expired or bad signature)
    payload = {"foo": "bar"}
    payload["exp"] = datetime_to_epoch(datetime.utcnow() + timedelta(days=1))
    token_1 = jwt.encode(payload, settings.TOKENS.SIGNING_KEY, algorithm="HS256")
    payload["foo"] = "baz"
    token_2 = jwt.encode(payload, settings.TOKENS.SIGNING_KEY, algorithm="HS256")

    token_2_payload = token_2.rsplit(".", 1)[0]
    token_1_sig = token_1.rsplit(".", 1)[-1]
    invalid_token = token_2_payload + "." + token_1_sig

    t = await MyToken.create(invalid_token, verify=False)

    assert t.payload == payload


async def test_init_expired_token_given() -> None:
    t = await MyToken.create()
    t.set_exp(lifetime=-timedelta(seconds=1))

    with pytest.raises(ExpiredTokenError):
        await MyToken.create(str(t))


async def test_init_no_type_token_given() -> None:
    t = await MyToken.create()
    del t[settings.TOKENS.TOKEN_TYPE_CLAIM]

    with pytest.raises(TokenError):
        await MyToken.create(str(t))


async def test_init_wrong_type_token_given() -> None:
    t = await MyToken.create()
    t[settings.TOKENS.TOKEN_TYPE_CLAIM] = "wrong_type"

    with pytest.raises(TokenError):
        await MyToken.create(str(t))


async def test_init_no_jti_token_given() -> None:
    t = await MyToken.create()
    del t["jti"]

    with pytest.raises(TokenError):
        await MyToken.create(str(t))


async def test_str() -> None:
    token = await MyToken.create()
    token.set_exp(
        from_time=datetime(year=2000, month=1, day=1, tzinfo=timezone.utc),
        lifetime=timedelta(seconds=0),
    )

    # Delete all but one claim.  We want our lives to be easy and for there
    # to only be a couple of possible encodings.  We're only testing that a
    # payload is successfully encoded here, not that it has specific
    # content.
    del token[settings.TOKENS.TOKEN_TYPE_CLAIM]
    del token["jti"]

    # Should encode the given token
    encoded_token = str(token)

    # Depens on the order of the keys in the dict
    assert encoded_token in [
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk0NjY4NDgwMH0.rZeMtOlEp130jYrxFSRaa0Nb1qU5iQBsOFdhmeFylGM",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk0NjY4NDgwMH0.nzyCR5dMWIBZ2HQMEDroNoUBBGjgB19I8Ken97XV1Fg",
    ]


async def test_repr(token: MyToken) -> None:
    assert repr(token) == repr(token.payload)


async def test_getitem(token: MyToken) -> None:
    assert token["exp"], token.payload["exp"]


async def test_setitem(token: MyToken) -> None:
    token["test"] = 1234
    assert token.payload["test"], 1234


async def test_delitem(token: MyToken) -> None:
    token["test"] = 1234
    assert token.payload["test"], 1234

    del token["test"]
    assert "test" not in token


async def test_contains(token: MyToken) -> None:
    assert "exp" in token


async def test_get(token: MyToken) -> None:
    token["test"] = 1234

    assert 1234 == token.get("test")
    assert 1234 == token.get("test", 2345)

    assert token.get("does_not_exist") is None
    assert 1234 == token.get("does_not_exist", 1234)


async def test_set_jti() -> None:
    token = await MyToken.create()
    old_jti = token["jti"]

    token.set_jti()

    assert "jti" in token
    assert old_jti != token["jti"]


async def test_set_exp() -> None:
    now = datetime(year=2000, month=1, day=1, tzinfo=timezone.utc)

    token = await MyToken.create()
    token.current_time = now

    # By default, should add 'exp' claim to token using `self.current_time`
    # and the TOKEN_LIFETIME setting
    token.set_exp()
    assert token["exp"] == datetime_to_epoch(now + MyToken.lifetime)

    # Should allow overriding of beginning time, lifetime, and claim name
    token.set_exp(claim="refresh_exp", from_time=now, lifetime=timedelta(days=1))

    assert "refresh_exp" in token
    assert token["refresh_exp"] == datetime_to_epoch(now + timedelta(days=1))


async def test_set_exp_to_token_without_lifetime() -> None:
    token = await MyTokenWithoutLifetime.create()

    with pytest.raises(TokenError):
        token.set_exp()


async def test_check_exp() -> None:
    token = await MyToken.create()

    # Should raise an exception if no claim of given kind
    with pytest.raises(TokenError):
        token._verify_exp("non_existent_claim")

    current_time = token.current_time
    lifetime = timedelta(days=1)
    exp = token.current_time + lifetime

    token.set_exp(lifetime=lifetime)

    # By default, checks 'exp' claim against `self.current_time`.  Should
    # raise an exception if claim has expired.
    token.current_time = exp
    with pytest.raises(ExpiredTokenError):
        token._verify_exp()

    token.current_time = exp + timedelta(seconds=1)
    with pytest.raises(ExpiredTokenError):
        token._verify_exp()

    # Otherwise, should raise no exception
    token.current_time = current_time
    token._verify_exp()

    # Should allow specification of claim to be examined and timestamp to
    # compare against

    # Default claim
    with pytest.raises(ExpiredTokenError):
        token._verify_exp(current_time=exp)

    token.set_exp("refresh_exp", lifetime=timedelta(days=1))

    # Default timestamp
    token._verify_exp("refresh_exp")

    # Given claim and timestamp
    with pytest.raises(ExpiredTokenError):
        token._verify_exp("refresh_exp", current_time=current_time + timedelta(days=1))
    with pytest.raises(ExpiredTokenError):
        token._verify_exp("refresh_exp", current_time=current_time + timedelta(days=2))


async def test_for_object() -> None:
    user_id = 2
    username = "test_user"
    user = User(id=user_id, username=username)

    token = await MyToken.create_for_object(user)

    assert token[token.object_id_claim] == user_id


async def test_get_token_backend() -> None:
    token = await MyToken.create()

    assert token.token_backend == token_backend
