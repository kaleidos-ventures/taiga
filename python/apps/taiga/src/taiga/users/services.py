# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.base.utils.slug import generate_username_suffix
from taiga.exceptions import services as ex
from taiga.users import repositories as users_repositories


async def create_user(email: str, full_name: str, password: str) -> None:
    if await users_repositories.user_exists(email=email):
        raise ex.EmailAlreadyExistsError()

    username = await _generate_username(email=email)
    user = await users_repositories.create_user(email=email, username=username, full_name=full_name, password=password)

    # verify_token = "todo"
    # await send_email.defer(
    #         email_name='sign_up',
    #         to=[user.email],
    #         subject="Verify your email to start using Taiga",
    #         data={"verify_token": verify_token} TBD
    #     )

    return user


async def _generate_username(email: str) -> str:
    username = email.split("@")[0]
    suffix = ""
    while True:
        potential = f"{username}{suffix}"
        if not await users_repositories.user_exists(username=potential):
            return potential
        suffix = f"{generate_username_suffix()}"
