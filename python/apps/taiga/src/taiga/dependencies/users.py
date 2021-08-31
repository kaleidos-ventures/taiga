# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Any, Dict, Optional, Union

from fastapi import Depends
from taiga.exceptions.api import AuthenticationError
from taiga.models.users import AnonymousUser, User
from taiga.repositories import users as users_repo

from .auth import get_user_data_from_request


async def get_current_user(
    user_data: Optional[Dict[str, Any]] = Depends(get_user_data_from_request)
) -> Union[User, AnonymousUser]:
    """
    Get the user from the auth token in the request headers.
    """
    if user_data and (user := users_repo.get_first_user(**user_data, is_active=True, is_system=False)):
        if not user.is_active or user.is_system:
            raise AuthenticationError()
        return user

    return AnonymousUser()
