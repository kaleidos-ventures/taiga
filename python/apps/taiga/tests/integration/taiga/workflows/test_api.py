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

WRONG_SLUG = "wrong_slug"


##########################################################
# Workflow GET /projects/<project_id>/workflows
##########################################################


async def test_get_workflows(client):
    project = await f.create_project()

    client.login(project.created_by)
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


#################################################################
# Workflow GET /projects/<project_id>/workflows/{workflow_slug}
#################################################################


async def test_get_workflow(client):
    project = await f.create_project()
    workflow = await f.create_workflow(project=project)

    client.login(project.created_by)
    response = client.get(f"/projects/{project.b64id}/workflows/{workflow.slug}")
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_get_workflow_wrong_project_slug(client):
    project = await f.create_project()
    workflow = await f.create_workflow(project=project)

    client.login(project.created_by)
    response = client.get(f"/projects/WRONG_PJ_SLUG/workflows/{workflow.slug}")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_get_workflow_wrong_workflow_slug(client):
    project = await f.create_project()

    client.login(project.created_by)
    response = client.get(f"/projects/{project.b64id}/workflows/WRONG_W_SLUG")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_get_workflow_wrong_permissions(client):
    project = await f.create_project()
    workflow = await f.create_workflow(project=project)
    user = await f.create_user()

    client.login(user)
    response = client.get(f"/projects/{project.b64id}/workflows/{workflow.slug}")
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text


################################################################################
# Workflow status POST /projects/<project_id>/workflows/<workflow_slug>/statuses
################################################################################


async def test_create_workflow_status_invalid_workflow(client):
    project = await f.create_project()
    await f.create_workflow(project=project)

    data = {"name": "Closed", "color": 5}

    client.login(project.created_by)
    response = client.post(f"/projects/{project.b64id}/workflows/{WRONG_SLUG}/statuses", json=data)
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text


async def test_create_workflow_status_being_pj_admin_ok(client):
    project = await f.create_project()
    workflow = await f.create_workflow(project=project)

    data = {"name": "Closed", "color": 5}

    client.login(project.created_by)
    response = client.post(f"/projects/{project.b64id}/workflows/{workflow.slug}/statuses", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


async def test_create_workflow_status_forbidden(client):
    pj_member = await f.create_user()
    project = await f.create_project()
    pj_role = await f.create_project_role(is_admin=False, project=project)
    await f.create_project_membership(user=pj_member, project=project, role=pj_role)

    workflow = await f.create_workflow(project=project)

    data = {"name": "Closed", "color": 5}

    client.login(pj_member)
    response = client.post(f"/projects/{project.b64id}/workflows/{workflow.slug}/statuses", json=data)
    assert response.status_code == status.HTTP_403_FORBIDDEN, response.text
