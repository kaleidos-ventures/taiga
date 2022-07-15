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

from datetime import timedelta
from functools import cached_property
from typing import ClassVar

from taiga.conf import settings
from taiga.tokens.base import DenylistMixin, Token


class AccessToken(Token):
    token_type = "access"
    lifetime = timedelta(minutes=settings.ACCESS_TOKEN_LIFETIME)


class RefreshToken(DenylistMixin, Token):
    token_type = "refresh"
    lifetime = timedelta(minutes=settings.REFRESH_TOKEN_LIFETIME)
    no_copy_claims: ClassVar[tuple[str, ...]] = (
        settings.TOKENS.TOKEN_TYPE_CLAIM,
        "exp",
        # Both of these claims are included even though they may be the same.
        # It seems possible that a third party token might have a custom or
        # namespaced JTI claim as well as a default "jti" claim.  In that case,
        # we wouldn't want to copy either one.
        settings.TOKENS.JTI_CLAIM,
        "jti",
    )

    @cached_property
    def access_token(self) -> "AccessToken":
        """
        Returns an acess token created from this refresh token. Copies all
        claims present in this refresh token to the new access token except
        those claims listed in the `no_copy_claims` attribute.
        """
        access = AccessToken()

        # Use instantiation time of refresh token as relative timestamp for
        # access token "exp" claim.  This ensures that both, refresh and
        # access token, expire relative to the same time if they are created as
        # a pair.
        access.set_exp(from_time=self.current_time)

        for claim, value in self.payload.items():
            if claim not in self.no_copy_claims:
                access[claim] = value

        return access

    def regenerate(self) -> "RefreshToken":
        """
        This method is useful to generate a new token from an existing one,
        maintaining the payload and preventing the access to the database.
        """
        self.set_exp()
        self.set_jti()

        return self
