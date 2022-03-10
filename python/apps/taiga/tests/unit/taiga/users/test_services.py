# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from unittest.mock import AsyncMock, patch

import pytest
from taiga.exceptions import services as ex
from taiga.users import services
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# create_user
##########################################################


async def test_create_user_ok():
    email = "email@email.com"
    full_name = "Full Name"
    password = "CorrectP4ssword$"
    with patch("taiga.users.services.users_repositories", new_callable=AsyncMock) as fake_users_repo:
        fake_users_repo.user_exists.return_value = False
        await services.create_user(email=email, full_name=full_name, password=password)
        fake_users_repo.create_user.assert_awaited_once_with(
            email=email, username="email", full_name=full_name, password=password
        )


async def test_create_user_email_exists():
    email = "dup.email@email.com"
    await f.create_user(email=email)

    with pytest.raises(ex.EmailAlreadyExistsError):
        await services.create_user(email=email, full_name="Full Name", password="CorrectP4ssword&")
