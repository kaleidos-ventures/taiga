# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from datetime import datetime

from taiga.tokens import repositories as tokens_repo
from taiga.tokens.models import DenylistedToken, OutstandingToken
from taiga.users.models import User

###########################################
# Outstanding Token
###########################################


async def create_outstanding_token(
    user: User, jti: str, token: str, created_at: datetime, expires_at: datetime
) -> OutstandingToken:
    return await tokens_repo.create_outstanding_token(
        user=user, jti=jti, token=token, created_at=created_at, expires_at=expires_at
    )


async def get_or_create_outstanding_token(jti: str, token: str, expires_at: datetime) -> tuple[OutstandingToken, bool]:
    return await tokens_repo.get_or_create_outstanding_token(jti=jti, token=token, expires_at=expires_at)


###########################################
# Denylisted Token
###########################################


async def deny_token(token: OutstandingToken) -> tuple[DenylistedToken, bool]:
    return await tokens_repo.get_or_create_denylisted_token(token=token)


async def token_is_denied(jti: str) -> bool:
    return await tokens_repo.denylisted_token_exist(jti=jti)
