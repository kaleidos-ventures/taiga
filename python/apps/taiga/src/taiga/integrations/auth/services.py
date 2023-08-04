# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from taiga.auth import services as auth_services
from taiga.auth.serializers import AccessTokenWithRefreshSerializer
from taiga.base.utils import datetime
from taiga.base.utils.colors import generate_random_color
from taiga.conf import settings
from taiga.emails.emails import Emails
from taiga.emails.tasks import send_email
from taiga.projects.invitations import services as project_invitations_services
from taiga.users import repositories as users_repositories
from taiga.users import services as users_services
from taiga.users.models import User
from taiga.workspaces.invitations import services as workspace_invitations_services


async def social_login(
    email: str, full_name: str, social_key: str, social_id: str, bio: str, lang: str | None = None
) -> AccessTokenWithRefreshSerializer:
    user: User | None = None

    # check if the user exists and already has social login with the requested system
    auth_data = await users_repositories.get_auth_data(filters={"key": social_key, "value": social_id})
    if auth_data:
        user = auth_data.user
    else:
        # check if the user exists (without social login yet)
        user = await users_repositories.get_user(filters={"email": email})
        lang = lang if lang else settings.LANG

        if not user:
            # create a new user with social login data and verify it
            color = generate_random_color()
            user = await users_repositories.create_user(
                email=email, full_name=full_name, password=None, lang=lang, color=color
            )
            await users_services.verify_user(user)
            await project_invitations_services.update_user_projects_invitations(user=user)
            await workspace_invitations_services.update_user_workspaces_invitations(user=user)
        elif not user.is_active:
            # update existing (but not verified) user with social login data and verify it
            # username and email are the same
            # but full_name is got from social login, and previous password is deleted
            user.full_name = full_name
            user.password = ""
            user.lang = lang
            user = await users_repositories.update_user(user=user)
            await users_services.verify_user(user)
            await project_invitations_services.update_user_projects_invitations(user=user)
            await workspace_invitations_services.update_user_workspaces_invitations(user=user)
        else:
            # the user existed and now is adding a new login method
            # so we send her a warning email
            await send_social_login_warning_email(
                full_name=user.full_name, email=user.email, login_method=social_key.capitalize(), lang=lang
            )

        await users_repositories.create_auth_data(user=user, key=social_key, value=social_id)

    return await auth_services.create_auth_credentials(user=user)


async def send_social_login_warning_email(full_name: str, email: str, login_method: str, lang: str) -> None:
    context = {
        "full_name": full_name,
        "login_method": login_method,
        "login_time": datetime.aware_utcnow(),
    }
    await send_email.defer(email_name=Emails.SOCIAL_LOGIN_WARNING.value, to=email, context=context, lang=lang)
