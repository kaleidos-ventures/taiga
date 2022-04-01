# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi.testclient import TestClient as TestClientBase
from taiga.auth.tokens import AccessToken
from taiga.base.utils.asyncio import run_async_as_sync
from taiga.users.models import User


class TestClient(TestClientBase):
    def login(self, user: User) -> None:
        token = run_async_as_sync(AccessToken.create_for_object(user))
        self.headers["Authorization"] = f"Bearer {str(token)}"

    def logout(self) -> None:
        self.headers.pop("Authorization", None)
