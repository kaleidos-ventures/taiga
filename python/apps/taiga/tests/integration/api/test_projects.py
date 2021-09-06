# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


import pytest
from fastapi.testclient import TestClient
from taiga.main import api

pytestmark = pytest.mark.django_db


def test_get_projects() -> None:
    client = TestClient(api)
    response = client.get("/projects")
    assert response.status_code == 200
    assert len(response.json()) == 0
