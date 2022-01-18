# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


async def test_me_error_no_authenticated_user(client):
    response = client.get("/users/me")

    assert response.status_code == 401


async def test_me_success(client):
    user = await f.create_user()

    client.login(user)
    response = client.get("/users/me")

    assert response.status_code == 200
    assert "email" in response.json().keys()
