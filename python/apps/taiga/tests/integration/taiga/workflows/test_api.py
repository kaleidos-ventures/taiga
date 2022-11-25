# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


import pytest
from fastapi import status
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# GET /projects/<slug>/workflows
##########################################################


async def test_get_project_workflows(client):
    project = await f.create_project()

    client.login(project.owner)
    response = client.get(f"/projects/{project.b64id}/workflows")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_project_workflows_wrong_id(client):
    project = await f.create_project()
    non_existent_id = "xxxxxxxxxxxxxxxxxxxxxx"

    client.login(project.owner)
    response = client.get(f"/projects/{non_existent_id}/workflows")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_get_project_workflows_wrong_permissions(client):
    project = await f.create_project()
    user = await f.create_user()

    client.login(user)
    response = client.get(f"/projects/{project.b64id}/workflows")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text
