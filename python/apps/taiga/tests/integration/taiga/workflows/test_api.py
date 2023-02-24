# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


import pytest
from fastapi import status
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


##########################################################
# GET /projects/<project_slug>/workflows
##########################################################


async def test_get_workflows(client):
    project = await f.create_project()

    client.login(project.owner)
    response = client.get(f"/projects/{project.b64id}/workflows")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_workflows_wrong_id(client):
    user = await f.create_user()
    non_existent_id = "xxxxxxxxxxxxxxxxxxxxxx"
    client.login(user)
    response = client.get(f"/projects/{non_existent_id}/workflows")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_get_workflows_wrong_permissions(client):
    project = await f.create_project()
    user = await f.create_user()

    client.login(user)
    response = client.get(f"/projects/{project.b64id}/workflows")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


##########################################################
# GET /projects/<project_slug>/workflows/{workflow_slug}
##########################################################


async def test_get_workflow(client):
    project = await f.create_project()
    workflow = await f.create_workflow(project=project)

    client.login(project.owner)
    response = client.get(f"/projects/{project.b64id}/workflows/{workflow.slug}")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_workflow_wrong_project_slug(client):
    project = await f.create_project()
    workflow = await f.create_workflow(project=project)

    client.login(project.owner)
    response = client.get(f"/projects/WRONG_PJ_SLUG/workflows/{workflow.slug}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_get_workflow_wrong_workflow_slug(client):
    project = await f.create_project()

    client.login(project.owner)
    response = client.get(f"/projects/{project.b64id}/workflows/WRONG_W_SLUG")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_get_workflow_wrong_permissions(client):
    project = await f.create_project()
    workflow = await f.create_workflow(project=project)
    user = await f.create_user()

    client.login(user)
    response = client.get(f"/projects/{project.b64id}/workflows/{workflow.slug}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text
