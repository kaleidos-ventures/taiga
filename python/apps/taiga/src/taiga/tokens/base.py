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

from datetime import datetime, timedelta
from typing import TYPE_CHECKING, Any, ClassVar, Final, Optional, TypeVar
from uuid import uuid4

from taiga.base.utils.datetime import aware_utcnow, datetime_to_epoch, epoch_to_datetime
from taiga.conf import settings

from . import services as tokens_services
from .backends import TokenBackend, token_backend
from .exceptions import TokenBackendError, TokenError

USER_ID_FIELD: Final = "id"
USER_ID_CLAIM: Final = "user_id"

if TYPE_CHECKING:
    TokenModel = TypeVar("TokenModel", bound="Token")


class Token:
    """
    A class which validates and wraps an existing JWT or can be used to build a
    new JWT.
    """

    token_type: ClassVar[Optional[str]]
    lifetime: ClassVar[timedelta]

    def __init__(self, token: Optional[str] = None, verify: bool = True) -> None:
        """
        !!!! IMPORTANT !!!! MUST raise a TokenError with a user-facing error
        message if the given token is invalid, expired, or otherwise not safe
        to use.
        """
        if not getattr(self, "token_type", None) or not getattr(self, "lifetime", None):
            raise TokenError("Cannot create token with no type or lifetime")

        self.current_time = aware_utcnow()
        self.token = token

        # Set up token
        if token is not None:
            # Decode token
            try:
                self.payload = self.token_backend.decode(token, verify=verify)
            except TokenBackendError:
                raise TokenError("Token is invalid or expired")
        else:
            # New token.  Skip all the verification steps.
            self.payload = {settings.TOKENS.TOKEN_TYPE_CLAIM: self.token_type}

            # Set "exp" claim with default value
            self.set_exp(from_time=self.current_time, lifetime=self.lifetime)

            # Set "jti" claim
            self.set_jti()

    def set_exp(
        self, claim: str = "exp", from_time: Optional[datetime] = None, lifetime: Optional[timedelta] = None
    ) -> None:
        """
        Updates the expiration time of a token.
        """
        if from_time is None:
            from_time = self.current_time

        if lifetime is None:
            lifetime = self.lifetime

        self.payload[claim] = datetime_to_epoch(from_time + lifetime)

    def set_jti(self) -> None:
        """
        Populates the configured jti claim of a token with a string where there
        is a negligible probability that the same string will be chosen at a
        later time.

        See here:
        https://tools.ietf.org/html/rfc7519#section-4.1.7
        """
        self.payload[settings.TOKENS.JTI_CLAIM] = uuid4().hex

    def __repr__(self) -> str:
        return repr(self.payload)

    def __getitem__(self, key: str) -> Any:
        return self.payload[key]

    def __setitem__(self, key: str, value: Any) -> None:
        self.payload[key] = value

    def __delitem__(self, key: str) -> None:
        del self.payload[key]

    def __contains__(self, key: str) -> bool:
        return key in self.payload

    def __str__(self) -> str:
        """
        Signs and returns a token as a base64 encoded string.
        """
        return self.token_backend.encode(self.payload)

    def get(self, key: str, default: Any = None) -> Any:
        return self.payload.get(key, default)

    async def verify(self) -> None:
        """
        Performs additional validation steps which were not performed when this
        token was decoded.  This method is part of the "public" API to indicate
        the intention that it may be overridden in subclasses.
        """
        # According to RFC 7519, the "exp" claim is OPTIONAL
        # (https://tools.ietf.org/html/rfc7519#section-4.1.4).  As a more
        # correct behavior for authorization tokens, we require an "exp"
        # claim.  We don't want any zombie tokens walking around.
        self._verify_exp()

        # Ensure token id is present
        if settings.TOKENS.JTI_CLAIM not in self.payload:
            raise TokenError("Token has no id")

        self._verify_token_type()

    def _verify_exp(self, claim: str = "exp", current_time: Optional[datetime] = None) -> None:
        """
        Checks whether a timestamp value in the given claim has passed (since
        the given datetime value in `current_time`).  Raises a TokenError with
        a user-facing error message if so.
        """
        if current_time is None:
            current_time = self.current_time

        try:
            claim_value = self.payload[claim]
        except KeyError:
            raise TokenError(f"Token has no '{claim}' claim")

        claim_time = epoch_to_datetime(claim_value)

        if claim_time <= current_time:
            raise TokenError(f"Token '{claim}' claim has expired")

    def _verify_token_type(self) -> None:
        """
        Ensures that the token type claim is present and has the correct value.
        """
        try:
            token_type = self.payload[settings.TOKENS.TOKEN_TYPE_CLAIM]
        except KeyError:
            raise TokenError("Token has no type")

        if self.token_type != token_type:
            raise TokenError("Token has wrong type")

    @property
    def user_data(self) -> dict[str, Any]:
        """
        Get the saved user data from the payload. By default return a dict with
        the user id (ex. {"id": 2})
        """
        key = USER_ID_FIELD
        value = self.payload.get(USER_ID_CLAIM, None)
        return {key: value}

    @property
    def token_backend(self) -> TokenBackend:
        return token_backend

    @classmethod
    async def create_for_user(cls: type["TokenModel"], user: object) -> "TokenModel":
        """
        Returns an authorization token for the given user that will be provided
        after authenticating the user's credentials.
        """
        user_id = getattr(user, USER_ID_FIELD)
        token = cls()
        token[USER_ID_CLAIM] = user_id
        return token

    @classmethod
    async def create(cls: type["TokenModel"], token: Optional[str] = None, verify: bool = True) -> "TokenModel":
        """
        Returns an authorization token or decode and verify the token than will be provided
        after authenticating the user's credentials.
        """
        self = cls(token, verify)

        # Verify token
        if token is not None and verify:
            await self.verify()

        return self


if TYPE_CHECKING:
    _BaseMixin = Token
else:
    _BaseMixin = object


class DenylistMixin(_BaseMixin):
    async def verify(self) -> None:
        await self._check_denylist()
        await super().verify()

    async def _check_denylist(self) -> None:
        """
        Checks if this token is present in the token denylist.  Raises
        `TokenError` if so.
        """
        jti = self.payload[settings.TOKENS.JTI_CLAIM]

        if await tokens_services.token_is_denied(jti=jti):
            raise TokenError("Token is denylisted")

    async def denylist(self) -> None:
        """
        Ensures this token is included in the outstanding token list and
        adds it to the denylist.
        """
        jti = self.payload[settings.TOKENS.JTI_CLAIM]
        token = str(self)
        expires_at = epoch_to_datetime(self.payload["exp"])

        # Ensure outstanding token exists with given jti
        token, _ = await tokens_services.get_or_create_outstanding_token(jti=jti, token=token, expires_at=expires_at)

        await tokens_services.deny_token(token=token)

    @classmethod
    async def create_for_user(cls: type["TokenModel"], user: object) -> "TokenModel":
        """
        Adds this token to the outstanding token list.
        """
        token = await super().create_for_user(user)  # type: ignore[misc]  # https://github.com/python/mypy/issues/9282

        jti = token[settings.TOKENS.JTI_CLAIM]
        created_at = token.current_time
        expires_at = epoch_to_datetime(token["exp"])

        await tokens_services.create_outstanding_token(
            user=user, jti=jti, token=str(token), created_at=created_at, expires_at=expires_at
        )

        return token
