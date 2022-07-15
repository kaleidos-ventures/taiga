# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from datetime import datetime

from taiga.base.db.models import Model
from taiga.tokens import repositories as tokens_repositories
from taiga.tokens.models import DenylistedToken, OutstandingToken

###########################################
# Outstanding Token
###########################################


async def create_outstanding_token(
    obj: Model, jti: str, token_type: str, token: str, created_at: datetime, expires_at: datetime
) -> OutstandingToken:
    return await tokens_repositories.create_outstanding_token(
        obj=obj, jti=jti, token_type=token_type, token=token, created_at=created_at, expires_at=expires_at
    )


async def update_or_create_outstanding_token(
    obj: Model, jti: str, token_type: str, token: str, created_at: datetime, expires_at: datetime
) -> tuple[OutstandingToken, bool]:
    return await tokens_repositories.update_or_create_outstanding_token(
        obj=obj, jti=jti, token_type=token_type, token=token, created_at=created_at, expires_at=expires_at
    )


async def get_or_create_outstanding_token(
    jti: str, token_type: str, token: str, expires_at: datetime
) -> tuple[OutstandingToken, bool]:
    return await tokens_repositories.get_or_create_outstanding_token(
        jti=jti, token_type=token_type, token=token, expires_at=expires_at
    )


async def outstanding_token_exist(jti: str) -> bool:
    return await tokens_repositories.outstanding_token_exist(jti=jti)


###########################################
# Denylisted Token
###########################################


async def deny_token(token: OutstandingToken) -> tuple[DenylistedToken, bool]:
    return await tokens_repositories.get_or_create_denylisted_token(token=token)


async def token_is_denied(jti: str) -> bool:
    return await tokens_repositories.denylisted_token_exist(jti=jti)


###########################################
# clean_expired_tokens
###########################################


async def clean_expired_tokens() -> None:
    await tokens_repositories.clean_expired_tokens()
