# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from fastapi import FastAPI
from taiga.base.logging.middlewares import CorrelationIdMiddleware
from tests.utils.testclient import TestClient

app = FastAPI()
app.add_middleware(CorrelationIdMiddleware)


@app.get("/success")
def get_successok():
    return {}


client = TestClient(app)


def test_request_without_correlation_id():
    response = client.get("/success")
    assert response.status_code == 200, response.text
    assert response.headers.get("correlation-id", None)


def test_request_with_correlation_id():
    correlation_id = "test-id"
    response = client.get("/success", headers={"correlation-id": correlation_id})
    assert response.status_code == 200, response.text
    assert response.headers.get("correlation-id", None) == correlation_id
