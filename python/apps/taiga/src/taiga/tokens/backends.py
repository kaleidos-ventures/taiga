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

from typing import Any

import jwt
from jwt import ExpiredSignatureError, InvalidAlgorithmError, InvalidTokenError, algorithms
from taiga.base.utils import json
from taiga.conf import settings
from taiga.conf.tokens import ALLOWED_ALGORITHMS
from taiga.tokens import exceptions as ex


class TokenBackend:
    def __init__(
        self,
        algorithm: str,
        signing_key: str,
        verifying_key: str = "",
        audience: str | None = None,
        issuer: str | None = None,
    ):
        self._validate_algorithm(algorithm)

        self.algorithm = algorithm
        self.signing_key = signing_key
        self.audience = audience
        self.issuer = issuer
        if algorithm.startswith("HS"):
            self.verifying_key = signing_key
        else:
            self.verifying_key = verifying_key

    def _validate_algorithm(self, algorithm: str) -> None:
        """
        Ensure that the nominated algorithm is recognized, and that cryptography is installed for those
        algorithms that require it
        """
        if algorithm not in ALLOWED_ALGORITHMS:
            raise ex.TokenBackendError(f"Unrecognized algorithm type '{algorithm}'")

        if algorithm in algorithms.requires_cryptography and not algorithms.has_crypto:
            raise ex.TokenBackendError(f"You must have cryptography installed to use '{algorithm}'.")

    def encode(self, payload: dict[str, Any]) -> str:
        """
        Returns an encoded token for the given payload dictionary.
        """
        jwt_payload = payload.copy()
        if self.audience is not None:
            jwt_payload["aud"] = self.audience
        if self.issuer is not None:
            jwt_payload["iss"] = self.issuer

        return jwt.encode(jwt_payload, self.signing_key, algorithm=self.algorithm, json_encoder=json.JSONEncoder)

    def decode(self, token: str, verify: bool = True) -> dict[str, Any]:
        """
        Performs a validation of the given token and returns its payload
        dictionary.

        Raises a `TokenBackendError` if the token is malformed, if its
        signature check fails, or if its 'exp' claim indicates it has expired.
        """
        try:
            return jwt.decode(
                token,
                self.verifying_key,
                algorithms=[self.algorithm],
                verify=verify,
                audience=self.audience,
                issuer=self.issuer,
                options={"verify_aud": self.audience is not None, "verify_signature": verify},
            )
        except ExpiredSignatureError:
            raise ex.ExpiredTokenBackendError("Expired token")
        except InvalidAlgorithmError:
            raise ex.TokenBackendError("Invalid algorithm specified")
        except InvalidTokenError:
            raise ex.TokenBackendError("Token is invalid")


token_backend = TokenBackend(
    algorithm=settings.TOKENS.ALGORITHM,
    signing_key=settings.TOKENS.SIGNING_KEY or settings.SECRET_KEY,
    verifying_key=settings.TOKENS.VERIFYING_KEY,
    audience=settings.TOKENS.AUDIENCE,
    issuer=settings.TOKENS.ISSUER,
)
