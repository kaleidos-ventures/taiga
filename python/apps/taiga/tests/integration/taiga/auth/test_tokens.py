# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import pytest
from taiga.auth.tokens import RefreshToken
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


async def test_refresh_token_regenerate() -> None:
    # This test proves that it is possible to generate a refresh token from an existing one
    # and continue to use it without problems, postponing the creation of the OutstandingToken.
    user = await f.create_user(is_active=True)
    token = await RefreshToken.create_for_object(user)
    await token.denylist()

    token1 = token.regenerate()
    token1_copy = await RefreshToken.create(token=str(token1))
    assert str(token1) == str(token1_copy)

    await token1.denylist()
    token2 = token1.regenerate()

    token2_copy = await RefreshToken.create(token=str(token2))
    assert str(token2) == str(token2_copy)
