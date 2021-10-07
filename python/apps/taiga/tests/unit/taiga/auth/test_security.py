# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Optional

from fastapi import FastAPI, Security
from fastapi.security import HTTPAuthorizationCredentials
from taiga.auth.security import HTTPBearer
from tests.utils.testclient import TestClient

app = FastAPI()
client = TestClient(app)


# auto_error = True


@app.get("/credentials")
def get_credentials(credentials: Optional[HTTPAuthorizationCredentials] = Security(HTTPBearer())):
    return {"scheme": credentials.scheme, "credentials": credentials.credentials} if credentials else {}


def test_security_http_bearer_success_no_credentials():
    response = client.get("/credentials")
    assert response.status_code == 200, response.text
    assert response.json() == {}


def test_security_http_bearer_success_with_credentials():
    response = client.get("/credentials", headers={"Authorization": "Bearer foobar"})
    assert response.status_code == 200, response.text
    assert response.json() == {"scheme": "bearer", "credentials": "foobar"}


def test_security_http_bearer_error_incorrect_scheme_credentials():
    response = client.get("/credentials/", headers={"Authorization": "Basic notreally"})
    assert response.status_code == 401, response.text


# auto_error = False


@app.get("/credentials-no-auto-error")
def get_credentials_no_error(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(HTTPBearer(auto_error=False)),
):
    return {"scheme": credentials.scheme, "credentials": credentials.credentials} if credentials else {}


def test_security_http_bearer_success_no_auto_error():
    response = client.get("/credentials-no-auto-error/", headers={"Authorization": "Basic notreally"})
    assert response.status_code == 200, response.text
    assert response.json() == {}
