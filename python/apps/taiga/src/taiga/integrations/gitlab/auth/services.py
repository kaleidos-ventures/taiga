# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.auth import services as auth_services
from taiga.auth.dataclasses import AccessWithRefreshToken
from taiga.conf import settings
from taiga.integrations import services as integrations_services
from taiga.integrations.gitlab import exceptions as ex
from taiga.integrations.gitlab import services as gitlab_services
from taiga.users import repositories as users_repositories
from taiga.users import services as users_services


async def gitlab_login(code: str, redirect_uri: str) -> AccessWithRefreshToken:
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET or not settings.GITLAB_URL:
        raise ex.GitlabLoginError("Login with Gitlab is not available. Contact with the platform administrators.")

    access_token = await gitlab_services.get_access_to_gitlab(code=code, redirect_uri=redirect_uri)
    if not access_token:
        raise ex.GitlabLoginAuthenticationError("The provided code is not valid.")

    user_info = await gitlab_services.get_user_info_from_gitlab(access_token=access_token)
    if not user_info:
        raise ex.GitlabAPIError("Gitlab API is not responding.")

    return await _gitlab_login(
        email=user_info.email, full_name=user_info.full_name, gitlab_id=user_info.gitlab_id, bio=user_info.bio
    )


# TODO: this may be a generic function `def social_login`
async def _gitlab_login(email: str, full_name: str, gitlab_id: str, bio: str) -> AccessWithRefreshToken:
    # check if the user exists and already has gitlab login
    user = await users_repositories.get_user_from_auth_data(key="gitlab", value=gitlab_id)
    if not user:
        # check if the user exists (doesn't have gitlab login yet)
        user = await users_repositories.get_first_user(email=email)
        if not user:
            # create a new user with gitlab data and verify it
            username = await users_services._generate_username(email=email)
            user = await users_repositories.create_user(
                email=email, username=username, full_name=full_name, password=None
            )
            await users_repositories.verify_user(user)
        elif user and not user.is_active:
            # update existing (but not verified) user with gitlab data and verify it
            # username and email are the same
            # but full_name is got from gitlab, and previous password is deleted
            user = await users_repositories.update_user(
                user=user, new_values={"full_name": full_name, "password": None}
            )
            await users_repositories.verify_user(user)
        elif user:
            # the user existed and now is adding a new login method
            # so we send her a warning email
            await integrations_services.send_social_login_warning_email(
                full_name=user.full_name, email=user.email, login_method="Gitlab"
            )

        await users_repositories.create_auth_data(user=user, key="gitlab", value=gitlab_id)

    return await auth_services.create_auth_credentials(user=user)
