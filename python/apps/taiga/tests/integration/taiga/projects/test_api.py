# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


import pytest
from fastapi import status
from tests.utils import factories as f

pytestmark = pytest.mark.django_db(transaction=True)


def test_create_project_success(client):
    user = f.UserFactory()
    workspace = f.WorkspaceFactory(owner=user)
    data = {"name": "Project test", "color": 1, "workspace_slug": workspace.slug}
    f.ProjectTemplateFactory()

    client.login(user)
    response = client.post("/projects", json=data)
    assert response.status_code == status.HTTP_200_OK, response.text


def test_create_project_validation_error(client):
    user = f.UserFactory()
    f.WorkspaceFactory(owner=user)
    data = {"name": "My pro#%&乕شject", "color": 1, "workspace_slug": "ws-invalid"}

    client.login(user)
    response = client.post("/projects", json=data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY, response.text


def test_list_projects_success(client):
    user = f.UserFactory()
    workspace = f.WorkspaceFactory(owner=user)
    f.ProjectFactory(owner=user, workspace=workspace)

    client.login(user)
    response = client.get(f"/workspaces/{workspace.slug}/projects")
    assert response.status_code == status.HTTP_200_OK, response.text
    assert len(response.json()) == 1


def test_get_project_success(client):
    user = f.UserFactory()
    workspace = f.WorkspaceFactory(owner=user)
    slug = "project-test"
    f.ProjectFactory(slug=slug, owner=user, workspace=workspace)

    client.login(user)
    response = client.get(f"/projects/{slug}")
    assert response.status_code == status.HTTP_200_OK, response.text


def test_get_project_not_found_error(client):
    user = f.UserFactory()

    client.login(user)
    response = client.get("/projects/non-existent")
    assert response.status_code == status.HTTP_404_NOT_FOUND, response.text
