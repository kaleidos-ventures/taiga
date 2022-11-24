# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from fastapi.testclient import TestClient as TestClientBase
from taiga.auth.tokens import AccessToken
from taiga.base.utils.asyncio import run_async_as_sync
from taiga.main import api
from taiga.users.models import User


class TestClient(TestClientBase):
    def login(self, user: User) -> None:
        token = run_async_as_sync(AccessToken.create_for_object(user))
        self.headers["Authorization"] = f"Bearer {str(token)}"

    def logout(self) -> None:
        self.headers.pop("Authorization", None)


@pytest.fixture
def client() -> TestClient:
    return TestClient(api)


@pytest.fixture
def non_mocked_hosts() -> list[str]:
    # This is to prevent pytest_httpx from catching calls to the TestClient
    # https://github.com/Colin-b/pytest_httpx/tree/master#do-not-mock-some-requests
    return ["testserver"]
