# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from datetime import datetime
from typing import Tuple

from taiga.models.tokens import DenylistedToken, OutstandingToken
from taiga.models.users import User
from taiga.repositories import tokens

# -----------------
# Outstanding Token
# -----------------


def create_outstanding_token(
    user: User, jti: str, token: str, created_at: datetime, expires_at: datetime
) -> OutstandingToken:
    return tokens.create_outstanding_token(user, jti, token, created_at, expires_at)


def get_or_create_outstanding_token(jti: str, token: str, expires_at: datetime) -> Tuple[OutstandingToken, bool]:
    return tokens.get_or_create_outstanding_token(jti, token, expires_at)


# ----------------
# Denylisted Token
# ----------------


def deny_token(token: OutstandingToken) -> Tuple[DenylistedToken, bool]:
    return tokens.get_or_create_denylisted_token(token)


def token_is_denied(jti: str) -> bool:
    return tokens.denylisted_token_exist(jti)
