# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from taiga.exceptions.api.middlewares import UnexpectedExceptionMiddleware
from tests.utils.testclient import TestClient

CORS_ATTRS = {
    "allow_origins": ["*"],
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}

app = FastAPI()
app.add_middleware(UnexpectedExceptionMiddleware)
app.add_middleware(CORSMiddleware, **CORS_ATTRS)


@app.get("/success")
def get_successok():
    return {}


@app.get("/error")
def get_error():
    1 / 0
    return {}


client = TestClient(app)


def test_there_is_no_error():
    response = client.get("/success")
    assert response.status_code == 200, response.text
    assert response.json() == {}


def test_500_errors_has_cors_headers_with_origin_in_request(caplog):
    with caplog.at_level(logging.CRITICAL, logger="taiga.exceptions.api.middlewares"):
        response = client.get("/error", headers={"Origin": "http://example.com"})

    assert response.status_code == 500, response.text
    assert "access-control-allow-origin" in response.headers
    assert "access-control-allow-credentials" in response.headers

    error = response.json()["error"]
    assert "code" in error
    assert "detail" in error and isinstance(error["detail"], str)
    assert "msg" in error


def test_500_errors_has_not_cors_headers_without_origin_in_request(caplog):
    with caplog.at_level(logging.CRITICAL, logger="taiga.exceptions.api.middlewares"):
        response = client.get("/error")

    assert response.status_code == 500, response.text
    assert "access-control-allow-origin" not in response.headers
    assert "access-control-allow-credentials" not in response.headers

    error = response.json()["error"]
    assert "code" in error
    assert "detail" in error and isinstance(error["detail"], str)
    assert "msg" in error
