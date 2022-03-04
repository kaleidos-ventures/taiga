# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.base.utils.slug import generate_username_suffix
from taiga.tokens import exceptions as tokens_ex

from taiga.users import exceptions as ex
from taiga.users import repositories as users_repositories
from taiga.users.models import User
from taiga.users.tokens import VerifyUserToken


async def create_user(email: str, full_name: str, password: str) -> None:
    if await users_repositories.user_exists(email=email):
        raise ex.EmailAlreadyExistsError()

    username = await _generate_username(email=email)
    user = await users_repositories.create_user(email=email, username=username, full_name=full_name, password=password)

    # await send_email.defer(
    #    email_name='sign_up',
    #    to=[user.email],
    #    context={
    #       "verify_token": await _generate_verify_user_token(user)
    #    }
    # )

    return user


async def _generate_username(email: str) -> str:
    username = email.split("@")[0]
    suffix = ""
    while True:
        potential = f"{username}{suffix}"
        if not await users_repositories.user_exists(username=potential):
            return potential
        suffix = f"{generate_username_suffix()}"


async def _generate_verify_user_token(user: User) -> str:
    verify_user_token = await VerifyUserToken.create_for_user(user)
    return str(verify_user_token)


async def verify_user(token: str) -> User:
    try:
        verify_token = await VerifyUserToken.create(token)
    except tokens_ex.DeniedTokenError:
        raise ex.UsedVerifyUserTokenError()
    except tokens_ex.ExpiredTokenError:
        raise ex.ExpiredVerifyUserTokenError()
    except tokens_ex.TokenError:
        raise ex.BadVerifyUserTokenError()

    await verify_token.denylist()

    if user_data := verify_token.user_data:
        if user := await users_repositories.get_first_user(**user_data, is_active=False, is_system=False):
            await users_repositories.verify_user(user=user)
            return user

    raise ex.BadVerifyUserTokenError()
