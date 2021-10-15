# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from starlette.authentication import AuthenticationError
from taiga.auth import backend
from taiga.auth.tokens import AccessToken
from taiga.base.api import Request
from tests.utils import factories as f

pytestmark = [pytest.mark.django_db, pytest.mark.asyncio]

default_scope = {"type": "http", "headers": []}


async def test_authenticate_success_without_token():
    request = Request(default_scope)

    credential, user = await backend.authenticate(request)

    assert credential.scopes == []
    assert user.is_anonymous


async def test_authenticate_success_with_token():
    user = f.UserFactory()
    token = AccessToken.for_user(user)

    request = Request(default_scope)
    request._headers = {"Authorization": f"Bearer {token}"}

    credential, auth_user = await backend.authenticate(request)

    assert credential.scopes != []
    assert not auth_user.is_anonymous
    assert auth_user == user


async def test_authenticate_error_invalid_token():
    request = Request(default_scope)
    request._headers = {"Authorization": "Bearer invalid-token"}

    with pytest.raises(AuthenticationError):
        await backend.authenticate(request)
