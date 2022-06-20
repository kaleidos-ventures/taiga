# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


from taiga.auth import services as auth_services
from taiga.auth.dataclasses import AccessWithRefreshToken
from taiga.conf import settings
from taiga.integrations.github import exceptions as ex
from taiga.integrations.github import services as github_services
from taiga.users import repositories as users_repositories
from taiga.users import services as users_services


async def github_login(code: str) -> AccessWithRefreshToken:
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        raise ex.GithubLoginError("Login with Github is not available. Contact with the platform administrators.")

    access_token = await github_services.get_access_to_github(code=code)
    if not access_token:
        raise ex.GithubLoginAuthenticationError("The provided code is not valid.")

    user_info = await github_services.get_user_info_from_github(access_token=access_token)
    if not user_info:
        raise ex.GithubAPIError("Github API is not responding.")

    return await _github_login(
        email=user_info.email, full_name=user_info.full_name, github_id=user_info.github_id, bio=user_info.bio
    )


async def _github_login(email: str, full_name: str, github_id: str, bio: str) -> AccessWithRefreshToken:
    # check if the user exists and already has github login
    user = await users_repositories.get_user_from_auth_data(key="github", value=github_id)
    if not user:
        # check if the user exists (doesn't have github login yet)
        user = await users_repositories.get_first_user(email=email)
        if not user:
            # create a new user with github data and verify it
            username = await users_services._generate_username(email=email)
            user = await users_repositories.create_user(
                email=email, username=username, full_name=full_name, password=None
            )
            await users_repositories.verify_user(user)
        elif user and not user.is_active:
            # update existing (but not verified) user with github data and verify it
            # username and email are the same
            # but full_name is got from github, and previous password is deleted
            user = await users_repositories.update_user(
                user=user, new_values={"full_name": full_name, "password": None}
            )
            await users_repositories.verify_user(user)

        await users_repositories.create_auth_data(user=user, key="github", value=github_id)

    return await auth_services.create_auth_credentials(user=user)
